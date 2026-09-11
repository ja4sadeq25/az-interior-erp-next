import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { bdtCompact, fmtDate, statusColor } from "@/lib/format";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const t = await getDict();
  const supabase = await createClient();
  const money = ["master", "admin", "finance"].includes(profile.role);

  const [{ data: projects }, { data: pos }, { data: invoices }, { data: snags }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("purchase_orders").select("total_amount, status"),
    supabase.from("invoices").select("total_amount, paid_amount"),
    supabase.from("snags").select("status"),
  ]);

  const list = (projects ?? []) as Project[];
  const active = list.filter((p) => p.status !== "completed");
  const consultancies = list.filter((p) => p.category === "consultancy");
  const executions = list.filter((p) => p.category === "execution");
  const poValue = (pos ?? []).reduce((s, p) => s + Number(p.total_amount || 0), 0);
  const billed = (invoices ?? []).reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const collected = (invoices ?? []).reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const openSnags = (snags ?? []).filter((s) => s.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-neutral-400 dark:text-neutral-500">{t.dashboard.kicker}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.dashboard.heading}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.dashboard.welcome} {profile.name}.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="stat-label">{t.dashboard.activeProjects}</p>
          <p className="stat-value">{active.length}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{consultancies.length} {t.category.consultancy} · {executions.length} {t.category.execution}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">{t.dashboard.openSnags}</p>
          <p className="stat-value">{openSnags}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{t.dashboard.acrossSites}</p>
        </div>
        {money ? (
          <>
            <div className="card p-5">
              <p className="stat-label">{t.dashboard.billedCollected}</p>
              <p className="stat-value">{bdtCompact(billed)}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{bdtCompact(collected)} {t.dashboard.collected}</p>
            </div>
            <div className="card p-5">
              <p className="stat-label">{t.dashboard.purchaseOrders}</p>
              <p className="stat-value">{bdtCompact(poValue)}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{(pos ?? []).length} {t.dashboard.ordersCommitted}</p>
            </div>
          </>
        ) : (
          <div className="card col-span-2 flex items-center justify-center p-5 lg:col-span-2">
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
              {t.dashboard.moneyRestrictedA}<br />{t.dashboard.moneyRestrictedB}
            </p>
          </div>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t.dashboard.recentProjects}</h2>
          <Link href="/projects" className="text-xs font-semibold text-neutral-900 underline dark:text-neutral-100">{t.dashboard.viewAll}</Link>
        </div>
        {list.length === 0 ? (
          <div className="card p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t.dashboard.noProjects}{" "}
            {["master", "admin", "project_manager"].includes(profile.role) && (
              <Link href="/projects/new" className="font-semibold underline">{t.dashboard.createFirst}</Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 transition hover:border-neutral-400 dark:hover:border-neutral-600">
                <div className="mb-2 flex items-center justify-between">
                  <span className="mono text-neutral-400 dark:text-neutral-500">{p.code}</span>
                  <span className={`badge ${statusColor(p.status)}`}>{t.status[p.status]}</span>
                </div>
                <h3 className="font-semibold leading-snug">{p.title}</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{p.client_name} · {fmtDate(p.start_date)}</p>
                {p.category === "execution" && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>{t.dashboard.progress}</span><span>{p.progress_pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div className="h-1.5 rounded-full bg-neutral-900 dark:bg-white" style={{ width: `${p.progress_pct}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
