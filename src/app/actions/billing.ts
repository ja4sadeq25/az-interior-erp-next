"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";

async function canBill() {
  const p = await requireProfile();
  if (!["master", "admin", "finance"].includes(p.role)) throw new Error("Billing is restricted to Master/Admin/Finance.");
  return p;
}

export async function createInvoice(f: {
  project_id: string; client_name: string; client_email: string; client_address: string;
  due_date: string; milestone_title: string; tax_rate: string; discount: string; items: string;
}) {
  try { await canBill(); } catch (e) { return { error: (e as Error).message }; }
  let items: { description: string; quantity: number; rate: number; amount: number }[];
  try { items = JSON.parse(f.items); } catch { return { error: "Invalid items payload." }; }
  if (!items.length) return { error: "Add at least one line item." };
  if (!f.client_name.trim()) return { error: "Client name is required." };
  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const taxRate = Number(f.tax_rate) || 0;
  const taxAmount = Math.round(subtotal * taxRate) / 100;
  const discount = Number(f.discount) || 0;
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").insert({
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
  });
  if (error) return { error: error.message };
  revalidatePath("/billing");
  return { ok: true };
}

export async function markSent(id: string) {
  try { await canBill(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", id).eq("status", "draft");
  if (error) return { error: error.message };
  revalidatePath("/billing");
  return { ok: true };
}

export async function recordPayment(invoiceId: string, amount: string, method: string, ref: string, note: string) {
  try { await canBill(); } catch (e) { return { error: (e as Error).message }; }
  const amt = Number(amount);
  if (!amt || amt <= 0) return { error: "Enter a valid amount." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    invoice_id: invoiceId, amount: amt, method, ref: ref || "", note: note || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/billing");
  return { ok: true };
}
