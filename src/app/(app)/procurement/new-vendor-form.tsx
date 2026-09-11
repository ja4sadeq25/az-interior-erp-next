"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVendor } from "@/app/actions/procurement";

const CATEGORIES = ["Timber & Joinery", "Marble, Tiles & Stone", "Smart Lighting & MEP", "Glass & Aluminium", "Paints & Wallpapers", "Hardware & Fittings", "Furnishings & Fabrics"];

export default function NewVendorForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setErr(null);
    start(async () => {
      const res = await createVendor(Object.fromEntries(fd) as never);
      if (res.error) setErr(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) return <button className="btn-ghost" onClick={() => setOpen(true)}>+ Register Vendor</button>;

  return (
    <form action={submit} className="card space-y-4 p-5">
      <h3 className="font-semibold">Register Vendor</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name *</label><input name="name" className="input" required /></div>
        <div>
          <label className="label">Category</label>
          <select name="category" className="input">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div><label className="label">Contact Person</label><input name="contact_person" className="input" /></div>
        <div><label className="label">Phone</label><input name="phone" className="input" /></div>
        <div><label className="label">Email</label><input name="email" className="input" type="email" /></div>
        <div><label className="label">Rating (0–5)</label><input name="rating" className="input" type="number" min="0" max="5" step="0.1" defaultValue="5" /></div>
        <div className="sm:col-span-2"><label className="label">Payment Terms</label><input name="payment_terms" className="input" placeholder="50% advance, 50% on delivery" /></div>
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save Vendor"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
