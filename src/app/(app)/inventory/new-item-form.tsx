"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "@/app/actions/inventory";

export default function NewItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setErr(null);
    start(async () => {
      const res = await createItem(Object.fromEntries(fd) as never);
      if (res.error) setErr(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>+ Add Item</button>;

  return (
    <form action={submit} className="card w-full max-w-2xl space-y-3 p-5">
      <h3 className="font-semibold">Add Inventory Item</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><label className="label">Name *</label><input name="name" className="input" required /></div>
        <div><label className="label">SKU</label><input name="sku" className="input" placeholder="AZ-TIM-001" /></div>
        <div><label className="label">Category</label><input name="category" className="input" placeholder="Timber" /></div>
        <div><label className="label">Unit</label><input name="unit" className="input" defaultValue="pcs" /></div>
        <div><label className="label">Warehouse Stock</label><input name="warehouse_stock" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">Site Stock</label><input name="site_stock" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">Reorder Level</label><input name="reorder_level" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">Unit Cost (৳)</label><input name="unit_cost" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">Location</label><input name="location" className="input" placeholder="Warehouse A" /></div>
        <div><label className="label">Supplier</label><input name="supplier_name" className="input" /></div>
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save Item"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
