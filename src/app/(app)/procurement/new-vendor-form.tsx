"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVendor } from "@/app/actions/procurement";
import { useT } from "@/components/providers";

export default function NewVendorForm() {
  const router = useRouter();
  const t = useT();
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

  if (!open) return <button className="btn-ghost" onClick={() => setOpen(true)}>{t.procurement.registerVendor}</button>;

  return (
    <form action={submit} className="card space-y-4 p-5">
      <h3 className="font-semibold">{t.procurement.registerTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">{t.procurement.nameReq}</label><input name="name" className="input" required /></div>
        <div>
          <label className="label">{t.procurement.category}</label>
          <select name="category" className="input">{t.procurement.categories.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div><label className="label">{t.procurement.contactPerson}</label><input name="contact_person" className="input" /></div>
        <div><label className="label">{t.common.phone}</label><input name="phone" className="input" /></div>
        <div><label className="label">{t.common.email}</label><input name="email" className="input" type="email" /></div>
        <div><label className="label">{t.procurement.rating}</label><input name="rating" className="input" type="number" min="0" max="5" step="0.1" defaultValue="5" /></div>
        <div className="sm:col-span-2"><label className="label">{t.procurement.paymentTerms}</label><input name="payment_terms" className="input" placeholder={t.procurement.paymentTermsPh} /></div>
      </div>
      {err && <p className="alert-error">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? t.procurement.saving : t.procurement.saveVendor}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
