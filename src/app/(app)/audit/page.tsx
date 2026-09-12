import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { fmtDateTime } from "@/lib/format";
import type { ActivityLog } from "@/lib/types";

export const dynamic = "force-dynamic";

const ENTITIES = ["all", "user", "project", "purchase_order", "invoice", "payment", "document"] as const;

function actionColor(action: string): string {
  if (action.startsWith("user."))
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900";
  if (action.startsWith("project."))
    return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900";
  if (action.startsWith("po."))
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
  if (action.startsWith("invoice.") || action.startsWith("payment."))
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900";
  return "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  const me = await requireProfile();
  if (!["master", "admin"].includes(me.role)) redirect("/");
  const t = await getDict();
  const raw = (await searchParams).entity ?? "all";
  const entity = (ENTITIES as readonly string[]).includes(raw) ? raw : "all";

  const supabase = await createClient();
  let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (entity !== "all") query = query.eq("entity", entity);
  const { data, error } = await query;

  // Migration not applied yet — guide the Master instead of crashing.
  const notEnabled = error?.code === "42P01";
  const logs = (data ?? []) as ActivityLog[];

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-neutral-400 dark:text-neutral-500">{t.audit.kicker}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.audit.heading}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.audit.desc}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {ENTITIES.map((e) => (
          <Link
            key={e}
            href={e === "all" ? "/audit" : `/audit?entity=${e}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              entity === e
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {t.audit.entities[e]}
          </Link>
        ))}
        {!error && logs.length > 0 && (
          <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">{t.audit.latest}</span>
        )}
      </div>

      {notEnabled ? (
        <div className="card border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {t.audit.notEnabled}
        </div>
      ) : error ? (
        <div className="card border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.message}
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.audit.empty}</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[900px]">
            <thead className="table-head">
              <tr>
                <th className="th">{t.audit.thTime}</th>
                <th className="th">{t.audit.thActor}</th>
                <th className="th">{t.audit.thAction}</th>
                <th className="th">{t.audit.thDetails}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {logs.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="td whitespace-nowrap text-xs">{fmtDateTime(l.created_at)}</td>
                  <td className="td">
                    <p className="text-sm font-semibold">{l.actor_name}</p>
                    {l.actor_role && <span className="badge mt-1">{t.roles[l.actor_role] ?? l.actor_role}</span>}
                  </td>
                  <td className="td">
                    <span className={`badge ${actionColor(l.action)}`}>{t.audit.actions[l.action] ?? l.action}</span>
                  </td>
                  <td className="td">
                    {l.entity_label && <p className="text-sm font-semibold">{l.entity_label}</p>}
                    {l.summary && <p className="text-xs text-neutral-500 dark:text-neutral-400">{l.summary}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
