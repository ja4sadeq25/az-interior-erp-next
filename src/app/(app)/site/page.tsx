import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { fmtDate, statusColor } from "@/lib/format";
import type { DailyLog, Snag } from "@/lib/types";
import DailyLogForm from "./daily-log-form";
import SnagForm from "./snag-form";
import SnagStatusSelect from "./snag-status";

export const dynamic = "force-dynamic";

export default async function SitePage() {
  const profile = await requireProfile();
  const t = await getDict();
  const canWrite = ["master", "admin", "project_manager", "site_engineer"].includes(profile.role);
  const supabase = await createClient();
  const [logRes, snagRes, projRes] = await Promise.all([
    supabase.from("daily_logs").select("*, projects(title, code)").order("log_date", { ascending: false }).limit(30),
    supabase.from("snags").select("*, projects(title, code)").order("reported_date", { ascending: false }).limit(50),
    supabase.from("projects").select("id, code, title").order("created_at", { ascending: false }),
  ]);
  const logs = (logRes.data ?? []) as DailyLog[];
  const snags = (snagRes.data ?? []) as Snag[];
  const projects = (projRes.data ?? []) as { id: string; code: string; title: string }[];
  const openSnags = snags.filter((s) => s.status !== "resolved");

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-neutral-400 dark:text-neutral-500">{t.site.kicker}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.site.heading}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{logs.length} {t.site.recentLogs} · {openSnags.length} {t.site.openSnags}</p>
      </header>

      {canWrite && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DailyLogForm projects={projects} />
          <SnagForm projects={projects} />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t.site.logsHeading}</h2>
        {logs.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.site.noLogs}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {logs.map((l) => {
              const w = l.workers;
              const total = Object.values(w ?? {}).reduce((s, n) => s + Number(n || 0), 0);
              return (
                <div key={l.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{l.projects?.title ?? "—"}</p>
                    <span className="mono text-neutral-400 dark:text-neutral-500">{fmtDate(l.log_date)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {l.engineer_name} · {l.weather} · {total} {t.site.workersOnSite}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{l.work_completed}</p>
                  {l.challenges && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">⚠ {l.challenges}</p>}
                  {l.materials_received && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t.site.materials} {l.materials_received}</p>}
                  <p className="mono mt-2 text-neutral-400 dark:text-neutral-500">
                    C:{Number(w?.carpenters || 0)} M:{Number(w?.masons || 0)} E:{Number(w?.electricians || 0)} P:{Number(w?.painters || 0)} Pl:{Number(w?.plumbers || 0)} H:{Number(w?.helpers || 0)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t.site.snagsHeading}</h2>
        {snags.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.site.noSnags}</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[760px]">
              <thead className="table-head">
                <tr>
                  <th className="th">{t.site.thDescription}</th>
                  <th className="th">{t.site.thProject}</th>
                  <th className="th">{t.site.thPriority}</th>
                  <th className="th">{t.site.thAssigned}</th>
                  <th className="th">{t.site.thReported}</th>
                  <th className="th">{t.site.thStatus}</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {snags.map((s) => (
                  <tr key={s.id}>
                    <td className="td">{s.description}</td>
                    <td className="td text-xs">{s.projects?.title ?? "—"}{s.space_name ? ` · ${s.space_name}` : ""}</td>
                    <td className="td"><span className={`badge ${statusColor(s.priority)}`}>{t.status[s.priority]}</span></td>
                    <td className="td text-xs">{s.assigned_to ?? "—"}</td>
                    <td className="td text-xs">{fmtDate(s.reported_date)}</td>
                    <td className="td">
                      {canWrite ? (
                        <SnagStatusSelect id={s.id} status={s.status} />
                      ) : (
                        <span className={`badge ${statusColor(s.status)}`}>{t.status[s.status]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
