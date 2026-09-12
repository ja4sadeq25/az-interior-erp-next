import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { bdt, fmtDate, statusColor } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import NewInvoiceForm from "./new-invoice-form";
import InvoiceActions from "./invoice-actions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const profile = await requireProfile();
  if (!["master", "admin", "finance"].includes(profile.role)) redirect("/");
  const t = await getDict();
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

  // Receipts live in the private photos bucket — sign them for this render.
  const receiptPaths = invoices.flatMap((i) =>
    (i.payment_history ?? []).map((p) => p.receipt).filter((r): r is string => !!r));
  const receiptUrls: Record<string, string> = {};
  if (receiptPaths.length) {
    const { data: signed } = await supabase.storage.from("photos").createSignedUrls(receiptPaths, 3600);
    signed?.forEach((sg, i) => { if (sg.signedUrl) receiptUrls[receiptPaths[i]] = sg.signedUrl; });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-neutral-400 dark:text-neutral-500">{t.billing.kicker}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.billing.heading}</h1>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5"><p className="stat-label">{t.billing.billed}</p><p className="stat-value tabular-nums">{bdt(billed)}</p></div>
        <div className="card p-5"><p className="stat-label">{t.billing.collected}</p><p className="stat-value tabular-nums text-emerald-700 dark:text-emerald-400">{bdt(collected)}</p></div>
        <div className="card p-5"><p className="stat-label">{t.billing.outstanding}</p><p className="stat-value tabular-nums text-amber-700 dark:text-amber-400">{bdt(outstanding)}</p></div>
      </div>

      <NewInvoiceForm projects={projects} />

      {invoices.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.billing.noInvoices}</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[900px]">
            <thead className="table-head">
              <tr>
                <th className="th">{t.billing.thInvoice}</th>
                <th className="th">{t.billing.thClient}</th>
                <th className="th">{t.billing.thDates}</th>
                <th className="th">{t.billing.thTotal}</th>
                <th className="th">{t.billing.thPaid}</th>
                <th className="th">{t.billing.thStatus}</th>
                <th className="th">{t.billing.thActions}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="td mono">{inv.invoice_number}<p className="text-[10px] normal-case text-neutral-400 dark:text-neutral-500">{inv.milestone_title}</p></td>
                  <td className="td">
                    <p className="font-semibold">{inv.client_name}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{inv.projects?.title ?? "—"}</p>
                  </td>
                  <td className="td text-xs">{fmtDate(inv.issue_date)}<br />{fmtDate(inv.due_date)}</td>
                  <td className="td font-semibold">{bdt(inv.total_amount)}</td>
                  <td className="td text-emerald-700 dark:text-emerald-400">{bdt(inv.paid_amount)}</td>
                  <td className="td"><span className={`badge ${statusColor(inv.status)}`}>{t.status[inv.status]}</span></td>
                  <td className="td"><InvoiceActions invoice={inv} isMaster={profile.role === "master"} receiptUrls={receiptUrls} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
