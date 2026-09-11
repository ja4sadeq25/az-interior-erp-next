"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createInvoice } from "@/app/actions/billing";

type Row = { description: string; quantity: string; rate: string };

export default function NewInvoiceForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ description: "", quantity: "1", rate: "" }]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const subtotal = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.rate) || 0), 0);

  function submit(fd: FormData) {
    const items = rows.filter((r) => r.description.trim()).map((r) => ({
      description: r.description.trim(), quantity: Number(r.quantity) || 0,
      rate: Number(r.rate) || 0, amount: (Number(r.quantity) || 0) * (Number(r.rate) || 0),
    }));
    setErr(null);
    start(async () => {
      const res = await createInvoice({
        project_id: String(fd.get("project_id") ?? ""),
        client_name: String(fd.get("client_name") ?? ""),
        client_email: String(fd.get("client_email") ?? ""),
        client_address: String(fd.get("client_address") ?? ""),
        due_date: String(fd.get("due_date") ?? ""),
        milestone_title: String(fd.get("milestone_title") ?? ""),
        tax_rate: String(fd.get("tax_rate") ?? "5"),
        discount: String(fd.get("discount") ?? "0"),
        items: JSON.stringify(items),
      });
      if (res.error) setErr(res.error);
      else { setOpen(false); setRows([{ description: "", quantity: "1", rate: "" }]); router.refresh(); }
    });
  }

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>+ New Invoice</button>;

  return (
    <form action={submit} className="card space-y-4 p-5">
      <h3 className="font-semibold">New Invoice</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">Client Name *</label><input name="client_name" className="input" required /></div>
        <div>
          <label className="label">Project</label>
          <select name="project_id" className="input">
            <option value="">— None —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div><label className="label">Milestone / Title</label><input name="milestone_title" className="input" placeholder="Phase 2 billing" /></div>
        <div><label className="label">Client Email</label><input name="client_email" className="input" type="email" /></div>
        <div><label className="label">Client Address</label><input name="client_address" className="input" /></div>
        <div><label className="label">Due Date</label><input name="due_date" className="input" type="date" /></div>
        <div><label className="label">VAT %</label><input name="tax_rate" className="input" type="number" min="0" step="0.5" defaultValue="5" /></div>
        <div><label className="label">Discount (৳)</label><input name="discount" className="input" type="number" min="0" defaultValue="0" /></div>
      </div>

      <div>
        <label className="label">Line Items</label>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <input className="input col-span-6" placeholder="Description" value={r.description}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <input className="input col-span-2" type="number" min="0" value={r.quantity}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />
              <input className="input col-span-2" type="number" min="0" placeholder="Rate ৳" value={r.rate}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))} />
              <span className="col-span-1 text-right text-xs font-semibold">
                {((Number(r.quantity) || 0) * (Number(r.rate) || 0)).toLocaleString()}
              </span>
              <button type="button" className="col-span-1 text-neutral-400 hover:text-red-600"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setRows([...rows, { description: "", quantity: "1", rate: "" }])}>
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
          <p className="text-sm font-bold">Subtotal: ৳{subtotal.toLocaleString()}</p>
        </div>
      </div>

      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? "Creating…" : "Create Invoice"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
