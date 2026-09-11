"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "@/app/actions/inventory";
import { useT } from "@/components/providers";

export default function NewItemForm() {
  const router = useRouter();
  const t = useT();
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

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>{t.inventory.addItem}</button>;

  return (
    <form action={submit} className="card w-full max-w-2xl space-y-3 p-5">
      <h3 className="font-semibold">{t.inventory.addTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><label className="label">{t.inventory.nameReq}</label><input name="name" className="input" required /></div>
        <div><label className="label">{t.inventory.sku}</label><input name="sku" className="input" placeholder="AZ-TIM-001" /></div>
        <div><label className="label">{t.inventory.category}</label><input name="category" className="input" placeholder={t.inventory.categoryPh} /></div>
        <div><label className="label">{t.inventory.unit}</label><input name="unit" className="input" defaultValue="pcs" /></div>
        <div><label className="label">{t.inventory.warehouseStock}</label><input name="warehouse_stock" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">{t.inventory.siteStock}</label><input name="site_stock" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">{t.inventory.reorderLevel}</label><input name="reorder_level" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">{t.inventory.unitCost}</label><input name="unit_cost" className="input" type="number" min="0" defaultValue="0" /></div>
        <div><label className="label">{t.inventory.location}</label><input name="location" className="input" placeholder={t.inventory.locationPh} /></div>
        <div><label className="label">{t.inventory.supplier}</label><input name="supplier_name" className="input" /></div>
      </div>
      {err && <p className="alert-error">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? t.inventory.saving : t.inventory.saveItem}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
