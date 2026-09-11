import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { fmtDate, STATUS_LABEL, statusColor } from "@/lib/format";
import type { DailyLog, Snag } from "@/lib/types";
import DailyLogForm from "./daily-log-form";
import SnagForm from "./snag-form";
import SnagStatusSelect from "./snag-status";

export const dynamic = "force-dynamic";

export default async function SitePage() {
  const profile = await requireProfile();
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
        <p className="mono text-neutral-400">Field Operations</p>
        <h1 className="text-2xl font-bold tracking-tight">Site Execution Desk</h1>
        <p className="text-sm text-neutral-500">{logs.length} recent daily logs · {openSnags.length} open snags</p>
      </header>

      {canWrite && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DailyLogForm projects={projects} />
          <SnagForm projects={projects} />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Daily Site Logs</h2>
        {logs.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500">No daily logs yet.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {logs.map((l) => {
              const w = l.workers;
              const total = Object.values(w ?? {}).reduce((s, n) => s + Number(n || 0), 0);
              return (
                <div key={l.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{l.projects?.title ?? "—"}</p>
                    <span className="mono text-neutral-400">{fmtDate(l.log_date)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {l.engineer_name} · {l.weather} · {total} workers on site
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">{l.work_completed}</p>
                  {l.challenges && <p className="mt-1 text-xs text-amber-700">⚠ {l.challenges}</p>}
                  {l.materials_received && <p className="mt-1 text-xs text-neutral-500">Materials: {l.materials_received}</p>}
                  <p className="mono mt-2 text-neutral-400">
                    C:{Number(w?.carpenters || 0)} M:{Number(w?.masons || 0)} E:{Number(w?.electricians || 0)} P:{Number(w?.painters || 0)} Pl:{Number(w?.plumbers || 0)} H:{Number(w?.helpers || 0)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Snag List</h2>
        {snags.length === 0 ? (
          <div className="card p-8 text-center text-sm text-neutral-500">No snags reported. Clean sites. 🎉</div>
        ) : (
          <div className="table-wrap">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="th">Description</th>
                  <th className="th">Project / Space</th>
                  <th className="th">Priority</th>
                  <th className="th">Assigned</th>
                  <th className="th">Reported</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {snags.map((s) => (
                  <tr key={s.id}>
                    <td className="td">{s.description}</td>
                    <td className="td text-xs">{s.projects?.title ?? "—"}{s.space_name ? ` · ${s.space_name}` : ""}</td>
                    <td className="td"><span className={`badge ${statusColor(s.priority)}`}>{STATUS_LABEL[s.priority]}</span></td>
                    <td className="td text-xs">{s.assigned_to ?? "—"}</td>
                    <td className="td text-xs">{fmtDate(s.reported_date)}</td>
                    <td className="td">
                      {canWrite ? (
                        <SnagStatusSelect id={s.id} status={s.status} />
                      ) : (
                        <span className={`badge ${statusColor(s.status)}`}>{STATUS_LABEL[s.status]}</span>
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
