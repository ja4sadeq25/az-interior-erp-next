import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { bdtCompact, fmtDate, STATUS_LABEL, statusColor } from "@/lib/format";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
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
        <p className="mono text-neutral-400">Executive Command</p>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500">Welcome back, {profile.name}.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="stat-label">Active Projects</p>
          <p className="stat-value">{active.length}</p>
          <p className="text-xs text-neutral-400">{consultancies.length} consultancy · {executions.length} execution</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Open Snags</p>
          <p className="stat-value">{openSnags}</p>
          <p className="text-xs text-neutral-400">across all sites</p>
        </div>
        {money ? (
          <>
            <div className="card p-5">
              <p className="stat-label">Billed / Collected</p>
              <p className="stat-value">{bdtCompact(billed)}</p>
              <p className="text-xs text-neutral-400">{bdtCompact(collected)} collected</p>
            </div>
            <div className="card p-5">
              <p className="stat-label">Purchase Orders</p>
              <p className="stat-value">{bdtCompact(poValue)}</p>
              <p className="text-xs text-neutral-400">{(pos ?? []).length} orders committed</p>
            </div>
          </>
        ) : (
          <div className="card col-span-2 flex items-center justify-center p-5 lg:col-span-2">
            <p className="text-center text-xs text-neutral-400">
              Financial KPIs are restricted to the<br />Master Account & Finance role.
            </p>
          </div>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Recent Projects</h2>
          <Link href="/projects" className="text-xs font-semibold text-neutral-900 underline">View all</Link>
        </div>
        {list.length === 0 ? (
          <div className="card p-10 text-center text-sm text-neutral-500">
            No projects yet.{" "}
            {["master", "admin", "project_manager"].includes(profile.role) && (
              <Link href="/projects/new" className="font-semibold underline">Create the first project</Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 transition hover:border-neutral-400">
                <div className="mb-2 flex items-center justify-between">
                  <span className="mono text-neutral-400">{p.code}</span>
                  <span className={`badge ${statusColor(p.status)}`}>{STATUS_LABEL[p.status]}</span>
                </div>
                <h3 className="font-semibold leading-snug">{p.title}</h3>
                <p className="mt-1 text-xs text-neutral-500">{p.client_name} · {fmtDate(p.start_date)}</p>
                {p.category === "execution" && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] text-neutral-500">
                      <span>Progress</span><span>{p.progress_pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100">
                      <div className="h-1.5 rounded-full bg-neutral-900" style={{ width: `${p.progress_pct}%` }} />
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
