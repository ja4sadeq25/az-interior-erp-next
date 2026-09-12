"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { bdt } from "@/lib/format";

async function canBill() {
  const p = await requireProfile();
  if (!["master", "admin", "finance"].includes(p.role)) throw new Error("Billing is restricted to Master/Admin/Finance.");
  return p;
}

export async function createInvoice(f: {
  project_id: string; client_name: string; client_email: string; client_address: string;
  due_date: string; milestone_title: string; tax_rate: string; discount: string; items: string;
}) {
  let profile;
  try { profile = await canBill(); } catch (e) { return { error: (e as Error).message }; }
  let items: { description: string; quantity: number; rate: number; amount: number }[];
  try { items = JSON.parse(f.items); } catch { return { error: "Invalid items payload." }; }
  if (!items.length) return { error: "Add at least one line item." };
  if (!f.client_name.trim()) return { error: "Client name is required." };
  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const taxRate = Number(f.tax_rate) || 0;
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const discount = Number(f.discount) || 0;
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices").insert({
    project_id: f.project_id || null,
    client_name: f.client_name.trim(),
    client_email: f.client_email || null,
    client_address: f.client_address || null,
    due_date: f.due_date || null,
    milestone_title: f.milestone_title || null,
    items,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount,
    total_amount: subtotal + taxAmount - discount,
    status: "draft",
  }).select("invoice_number").single();
  if (error) return { error: error.message };
  await logActivity({
    actor: profile, action: "invoice.created", entity: "invoice", entityId: null,
    entityLabel: `${data.invoice_number ?? "INV"} · ${f.client_name.trim()}`,
    summary: `draft invoice created · total ${bdt(subtotal + taxAmount - discount)}`,
    metadata: { total: subtotal + taxAmount - discount, milestone: f.milestone_title || null, project_id: f.project_id || null },
  });
  revalidatePath("/billing");
  return { ok: true };
}

export async function markSent(id: string) {
  let profile;
  try { profile = await canBill(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices").update({ status: "sent" })
    .eq("id", id).eq("status", "draft").select("invoice_number, client_name");
  if (error) return { error: error.message };
  if (data && data.length) {
    const inv = data[0];
    await logActivity({
      actor: profile, action: "invoice.sent", entity: "invoice", entityId: id,
      entityLabel: `${inv.invoice_number ?? "INV"} · ${inv.client_name}`,
      summary: "invoice marked as sent to client",
      metadata: {},
    });
  }
  revalidatePath("/billing");
  return { ok: true };
}

export async function recordPayment(invoiceId: string, amount: string, method: string, ref: string, note: string, paidOn?: string) {
  let profile;
  try { profile = await canBill(); } catch (e) { return { error: (e as Error).message }; }
  const amt = Number(amount);
  if (!amt || amt <= 0) return { error: "Enter a valid amount." };
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("invoice_number, client_name").eq("id", invoiceId).single();
  const today = new Date().toISOString().slice(0, 10);
  const on = paidOn && paidOn <= today ? paidOn : today;
  const { error } = await supabase.rpc("record_payment", {
    invoice_id: invoiceId, amount: amt, method, ref: ref || "", note: note || null, paid_on: on,
  });
  if (error) return { error: error.message };
  await logActivity({
    actor: profile, action: "payment.recorded", entity: "payment", entityId: invoiceId,
    entityLabel: `${inv?.invoice_number ?? "INV"} · ${inv?.client_name ?? ""}`,
    summary: `payment ${bdt(amt)} via ${method} on ${on}${ref ? ` · ref ${ref}` : ""}`,
    metadata: { amount: amt, method, ref, paid_on: on, invoice_id: invoiceId },
  });
  revalidatePath("/billing");
  return { ok: true };
}

/** Master-only hard delete. The row is logged before it goes, so the trail survives. */
export async function deleteInvoice(id: string) {
  const profile = await requireProfile();
  if (profile.role !== "master") return { error: "Only the Master account can delete an invoice." };
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices")
    .select("invoice_number, client_name, total_amount, paid_amount").eq("id", id).single();
  await logActivity({
    actor: profile, action: "invoice.deleted", entity: "invoice", entityId: id,
    entityLabel: `${inv?.invoice_number ?? "INV"} · ${inv?.client_name ?? ""}`,
    summary: `invoice deleted · total ${bdt(inv?.total_amount ?? 0)} · paid ${bdt(inv?.paid_amount ?? 0)}`,
    metadata: { invoice: inv ?? null },
  });
  const { error } = await supabase.rpc("master_delete", { p_table: "invoices", p_id: id });
  if (error) return { error: error.message };
  revalidatePath("/billing");
  return { ok: true };
}
