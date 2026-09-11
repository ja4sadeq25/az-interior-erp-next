import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { bdt, bdtCompact, fmtDate, STATUS_LABEL, statusColor } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import NewInvoiceForm from "./new-invoice-form";
import InvoiceActions from "./invoice-actions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const profile = await requireProfile();
  if (!["master", "admin", "finance"].includes(profile.role)) redirect("/");
  const supabase = await createClient();
  const [invRes, projRes] = await Promise.all([
    supabase.from("invoices").select("*, projects(title, code)").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, code, title").order("created_at", { ascending: false }),
  ]);
  const invoices = (invRes.data ?? []) as Invoice[];
  const projects = (projRes.data ?? []) as { id: string; code: string; title: string }[];

  const billed = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const collected = invoices.reduce((s, i) => s + Number(i.paid_amount), 0);
  const outstanding = billed - collected;

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-neutral-400">Finance Command</p>
        <h1 className="text-2xl font-bold tracking-tight">Client Billing & Invoices</h1>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5"><p className="stat-label">Billed</p><p className="stat-value">{bdtCompact(billed)}</p></div>
        <div className="card p-5"><p className="stat-label">Collected</p><p className="stat-value text-emerald-700">{bdtCompact(collected)}</p></div>
        <div className="card p-5"><p className="stat-label">Outstanding</p><p className="stat-value text-amber-700">{bdtCompact(outstanding)}</p></div>
      </div>

      <NewInvoiceForm projects={projects} />

      {invoices.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500">No invoices yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="th">Invoice #</th>
                <th className="th">Client / Project</th>
                <th className="th">Issued / Due</th>
                <th className="th">Total</th>
                <th className="th">Paid</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="td mono">{inv.invoice_number}<p className="text-[10px] normal-case text-neutral-400">{inv.milestone_title}</p></td>
                  <td className="td">
                    <p className="font-semibold">{inv.client_name}</p>
                    <p className="text-xs text-neutral-400">{inv.projects?.title ?? "—"}</p>
                  </td>
                  <td className="td text-xs">{fmtDate(inv.issue_date)}<br />{fmtDate(inv.due_date)}</td>
                  <td className="td font-semibold">{bdt(inv.total_amount)}</td>
                  <td className="td text-emerald-700">{bdt(inv.paid_amount)}</td>
                  <td className="td"><span className={`badge ${statusColor(inv.status)}`}>{STATUS_LABEL[inv.status]}</span></td>
                  <td className="td"><InvoiceActions invoice={inv} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
