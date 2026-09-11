"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSent, recordPayment } from "@/app/actions/billing";
import type { Invoice } from "@/lib/types";

export default function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function pay() {
    setMsg(null);
    start(async () => {
      const res = await recordPayment(invoice.id, amount, method, ref, "");
      setMsg(res.error ?? "Payment recorded");
      if (!res.error) { setAmount(""); setShow(false); }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {invoice.status === "draft" && (
          <button className="btn-ghost px-2 py-1 text-[11px]" disabled={pending}
            onClick={() => start(async () => { await markSent(invoice.id); router.refresh(); })}>
            Mark Sent
          </button>
        )}
        {invoice.status !== "paid" && (
          <button className="btn px-2 py-1 text-[11px]" disabled={pending} onClick={() => setShow(!show)}>
            + Payment
          </button>
        )}
      </div>
      {show && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input className="input w-24 px-2 py-1 text-xs" type="number" min="1" placeholder="৳" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="select px-2 py-1 text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="bank_transfer">Bank</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
            <option value="bKash/Nagad">bKash/Nagad</option>
            <option value="online">Online</option>
          </select>
          <input className="input w-28 px-2 py-1 text-xs" placeholder="Ref #" value={ref} onChange={(e) => setRef(e.target.value)} />
          <button className="btn px-2 py-1 text-[11px]" onClick={pay} disabled={pending}>Save</button>
        </div>
      )}
      {msg && <p className="text-[10px] text-neutral-500">{msg}</p>}
      {invoice.payment_history.length > 0 && (
        <p className="text-[10px] text-neutral-400">{invoice.payment_history.length} payment(s) recorded</p>
      )}
    </div>
  );
}
