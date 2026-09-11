"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createPo } from "@/app/actions/procurement";
import { useT } from "@/components/providers";

type Row = { itemName: string; category: string; quantity: string; unit: string; unitPrice: string };
const EMPTY: Row = { itemName: "", category: "", quantity: "1", unit: "pcs", unitPrice: "" };

export default function NewPoForm({ vendors, projects }: {
  vendors: { id: string; name: string }[];
  projects: { id: string; code: string; title: string }[];
}) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY }]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0);

  function submit(fd: FormData) {
    const items = rows
      .filter((r) => r.itemName.trim())
      .map((r) => ({
        itemName: r.itemName.trim(), category: r.category, quantity: Number(r.quantity) || 0,
        unit: r.unit, unitPrice: Number(r.unitPrice) || 0,
        total: (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
      }));
    setErr(null);
    start(async () => {
      const res = await createPo({
        project_id: String(fd.get("project_id") ?? ""),
        vendor_id: String(fd.get("vendor_id") ?? ""),
        expected_delivery: String(fd.get("expected_delivery") ?? ""),
        notes: String(fd.get("notes") ?? ""),
        items: JSON.stringify(items),
      });
      if (res.error) setErr(res.error);
      else { setOpen(false); setRows([{ ...EMPTY }]); router.refresh(); }
    });
  }

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>{t.procurement.newPo}</button>;

  return (
    <form action={submit} className="card space-y-4 p-5">
      <h3 className="font-semibold">{t.procurement.newPoTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">{t.procurement.project}</label>
          <select name="project_id" className="input">
            <option value="">{t.common.none}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t.procurement.vendor}</label>
          <select name="vendor_id" className="input">
            <option value="">{t.common.selectVendor}</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t.procurement.expected}</label>
          <input name="expected_delivery" type="date" className="input" />
        </div>
      </div>

      <div>
        <label className="label">{t.procurement.lineItems}</label>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <input className="input col-span-4" placeholder={t.procurement.itemName} value={r.itemName}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, itemName: e.target.value } : x))} />
              <input className="input col-span-2" placeholder={t.procurement.categoryPh} value={r.category}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} />
              <input className="input col-span-1" type="number" min="0" value={r.quantity}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />
              <input className="input col-span-1" placeholder={t.procurement.unitPh} value={r.unit}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} />
              <input className="input col-span-2" type="number" min="0" placeholder={t.procurement.unitPricePh} value={r.unitPrice}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, unitPrice: e.target.value } : x))} />
              <span className="col-span-1 text-right text-xs font-semibold">
                {((Number(r.quantity) || 0) * (Number(r.unitPrice) || 0)).toLocaleString()}
              </span>
              <button type="button" className="col-span-1 text-neutral-400 hover:text-red-600 dark:text-neutral-500"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setRows([...rows, { ...EMPTY }])}>
            <Plus className="h-3.5 w-3.5" /> {t.procurement.addItem}
          </button>
          <p className="text-sm font-bold">{t.procurement.total}{total.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <label className="label">{t.procurement.notes}</label>
        <textarea name="notes" className="textarea" rows={2} />
      </div>
      {err && <p className="alert-error">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? t.procurement.creating : t.procurement.createPo}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
