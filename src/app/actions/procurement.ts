"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";

async function canProcure() {
  const p = await requireProfile();
  if (!["master", "admin", "procurement"].includes(p.role)) throw new Error("Only the procurement desk can do this.");
  return p;
}

export async function createPo(f: {
  project_id: string; vendor_id: string; expected_delivery: string; notes: string; items: string;
}) {
  let profile;
  try { profile = await canProcure(); } catch (e) { return { error: (e as Error).message }; }
  let items: { itemName: string; category?: string; quantity: number; unit: string; unitPrice: number; total: number }[];
  try { items = JSON.parse(f.items); } catch { return { error: "Invalid items payload." }; }
  if (!items.length) return { error: "Add at least one line item." };
  const total = items.reduce((s, i) => s + Number(i.total || 0), 0);
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").insert({
    project_id: f.project_id || null,
    vendor_id: f.vendor_id || null,
    items,
    total_amount: total,
    expected_delivery: f.expected_delivery || null,
    notes: f.notes || null,
    approved_by: profile.name,
  });
  if (error) return { error: error.message };
  revalidatePath("/procurement");
  return { ok: true };
}

export async function updatePoStatus(id: string, status: string) {
  try { await canProcure(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "delivered") patch.delivered_date = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("purchase_orders").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/procurement");
  return { ok: true };
}

export async function createVendor(f: {
  name: string; category: string; contact_person: string; phone: string; email: string; rating: string; payment_terms: string;
}) {
  try { await canProcure(); } catch (e) { return { error: (e as Error).message }; }
  if (!f.name.trim()) return { error: "Vendor name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").insert({
    name: f.name.trim(),
    category: f.category || null,
    contact_person: f.contact_person || null,
    phone: f.phone || null,
    email: f.email || null,
    rating: f.rating ? Number(f.rating) : 0,
    payment_terms: f.payment_terms || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/procurement");
  return { ok: true };
}
