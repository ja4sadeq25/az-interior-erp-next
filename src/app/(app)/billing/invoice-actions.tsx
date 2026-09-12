"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSent, recordPayment, deleteInvoice } from "@/app/actions/billing";
import { useT } from "@/components/providers";
import type { Invoice } from "@/lib/types";

export default function InvoiceActions({ invoice, isMaster }: { invoice: Invoice; isMaster: boolean }) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [ref, setRef] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [paidOn, setPaidOn] = useState(today);
  const [confirmDel, setConfirmDel] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function pay() {
    setMsg(null);
    start(async () => {
      const res = await recordPayment(invoice.id, amount, method, ref, "", paidOn);
      setMsg(res.error ?? t.billing.paymentOk);
      if (!res.error) { setAmount(""); setPaidOn(today); setShow(false); }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {invoice.status === "draft" && (
          <button className="btn-ghost px-2 py-1 text-[11px]" disabled={pending}
            onClick={() => start(async () => { await markSent(invoice.id); router.refresh(); })}>
            {t.billing.markSent}
          </button>
        )}
        {invoice.status !== "paid" && (
          <button className="btn px-2 py-1 text-[11px]" disabled={pending} onClick={() => setShow(!show)}>
            {t.billing.addPayment}
          </button>
        )}
        {isMaster && !confirmDel && (
          <button className="btn-ghost px-2 py-1 text-[11px] text-rose-600 dark:text-rose-400"
            disabled={pending} onClick={() => setConfirmDel(true)}>
            {t.billing.del}
          </button>
        )}
        {isMaster && confirmDel && (
          <>
            <button className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-rose-600 text-white disabled:opacity-50"
              disabled={pending}
              onClick={() => start(async () => {
                const r = await deleteInvoice(invoice.id);
                if (r?.error) { setMsg(r.error); setConfirmDel(false); }
                router.refresh();
              })}>
              {t.billing.delConfirm}
            </button>
            <button className="btn-ghost px-2 py-1 text-[11px]" disabled={pending} onClick={() => setConfirmDel(false)}>
              {t.common.cancel}
            </button>
          </>
        )}
      </div>
      {show && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input className="input w-24 px-2 py-1 text-xs" type="number" min="1" placeholder="৳" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="select px-2 py-1 text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="bank_transfer">{t.billing.methodBank}</option>
            <option value="cheque">{t.billing.methodCheque}</option>
            <option value="cash">{t.billing.methodCash}</option>
            <option value="bKash/Nagad">{t.billing.methodMobile}</option>
            <option value="online">{t.billing.methodOnline}</option>
          </select>
          <input className="input w-28 px-2 py-1 text-xs" placeholder={t.billing.refPh} value={ref} onChange={(e) => setRef(e.target.value)} />
          <input className="input w-36 px-2 py-1 text-xs" type="date" max={today} title={t.billing.paidOn}
            value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          <button className="btn px-2 py-1 text-[11px]" onClick={pay} disabled={pending}>{t.common.save}</button>
        </div>
      )}
      {msg && <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{msg}</p>}
      {invoice.payment_history.length > 0 && (
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{invoice.payment_history.length} {t.billing.paymentsRecorded}</p>
      )}
    </div>
  );
}
