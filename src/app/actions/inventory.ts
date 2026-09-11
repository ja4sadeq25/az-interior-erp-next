"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";

async function canEdit() {
  const p = await requireProfile();
  if (!["master", "admin", "procurement", "site_engineer"].includes(p.role)) throw new Error("unauthorized");
  return p;
}

export async function createItem(f: {
  name: string; sku: string; category: string; unit: string; warehouse_stock: string;
  site_stock: string; reorder_level: string; unit_cost: string; location: string; supplier_name: string;
}) {
  try { await canEdit(); } catch (e) { return { error: (e as Error).message }; }
  if (!f.name.trim()) return { error: "Item name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").insert({
    name: f.name.trim(),
    sku: f.sku || null,
    category: f.category || null,
    unit: f.unit || "pcs",
    warehouse_stock: Number(f.warehouse_stock) || 0,
    site_stock: Number(f.site_stock) || 0,
    reorder_level: Number(f.reorder_level) || 0,
    unit_cost: Number(f.unit_cost) || 0,
    location: f.location || null,
    supplier_name: f.supplier_name || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { ok: true };
}

export async function adjustStock(id: string, warehouse: string, site: string) {
  try { await canEdit(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").update({
    warehouse_stock: Number(warehouse) || 0,
    site_stock: Number(site) || 0,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { ok: true };
}

export async function issueToSite(id: string, qty: string) {
  try { await canEdit(); } catch (e) { return { error: (e as Error).message }; }
  const q = Number(qty);
  if (!q || q <= 0) return { error: "Enter a quantity." };
  const supabase = await createClient();
  const { data } = await supabase.from("inventory_items").select("warehouse_stock, site_stock").eq("id", id).single();
  if (!data) return { error: "Item not found." };
  if (Number(data.warehouse_stock) < q) return { error: "Not enough warehouse stock." };
  const { error } = await supabase.from("inventory_items").update({
    warehouse_stock: Number(data.warehouse_stock) - q,
    site_stock: Number(data.site_stock) + q,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { ok: true };
}
