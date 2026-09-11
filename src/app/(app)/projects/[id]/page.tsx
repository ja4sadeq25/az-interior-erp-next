import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { bdt, fmtDate, STATUS_LABEL, statusColor } from "@/lib/format";
import type { Deliverable, DesignPhase, Milestone, Project } from "@/lib/types";
import StatusPanel from "./status-panel";
import PhaseCard from "./phase-card";
import MilestoneTable from "./milestone-table";
import ConvertPanel from "./convert-panel";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!data) notFound();
  const project = data as Project;

  const manage = ["master", "admin", "project_manager"].includes(profile.role);
  const money = ["master", "admin", "finance"].includes(profile.role);

  const [phasesRes, msRes] = await Promise.all([
    project.category === "consultancy"
      ? supabase.from("design_phases").select("*").eq("project_id", id).order("phase_number")
      : Promise.resolve({ data: [] }),
    supabase.from("milestones").select("*").eq("project_id", id).order("bill_pct", { ascending: false }),
  ]);
  const phases = (phasesRes.data ?? []) as DesignPhase[];
  const milestones = (msRes.data ?? []) as Milestone[];

  let deliverables: Deliverable[] = [];
  if (phases.length) {
    const { data: d } = await supabase.from("deliverables").select("*").in("phase_id", phases.map((p) => p.id));
    deliverables = (d ?? []) as Deliverable[];
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/projects" className="text-xs text-neutral-400 hover:underline">← All projects</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
            <span className={`badge ${statusColor(project.health)}`}>{STATUS_LABEL[project.health]}</span>
          </div>
          <p className="mono mt-1 text-neutral-400">
            {project.code} · <span className="capitalize">{project.category}</span> · {project.client_name}
          </p>
          {project.origin_consultancy_id && (
            <p className="mt-1 text-xs text-neutral-500">
              Converted from consultancy ·{" "}
              <Link className="underline" href={`/projects/${project.origin_consultancy_id}`}>view design project</Link>
            </p>
          )}
        </div>
        {manage && <StatusPanel project={project} />}
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="stat-label">Client</p>
          <p className="font-semibold">{project.client_name}</p>
          <p className="text-xs text-neutral-500">{project.client_phone ?? "—"} · {project.client_email ?? "—"}</p>
          <p className="mt-2 text-xs text-neutral-500">{project.location ?? "—"}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Timeline</p>
          <p className="font-semibold">{fmtDate(project.start_date)} → {fmtDate(project.end_date)}</p>
          <p className="text-xs text-neutral-500">Target: {project.target_weeks ?? "—"} weeks</p>
        </div>
        <div className="card p-5">
          {project.category === "consultancy" ? (
            <>
              <p className="stat-label">Design Fee</p>
              <p className="font-semibold">{money ? bdt(project.consultancy_fee) : "••••••"}</p>
              <p className="text-xs text-neutral-500">Visible to Master / Admin / Finance</p>
            </>
          ) : (
            <>
              <p className="stat-label">Contract Value</p>
              <p className="font-semibold">{money ? bdt(project.contract_value) : "••••••"}</p>
              {money && (
                <p className="text-xs text-neutral-500">
                  Est. {bdt(project.estimated_cost)} · Actual {bdt(project.actual_cost)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {project.category === "consultancy" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Design Roadmap · Week {project.current_week}/6</h2>
          </div>
          {phases.map((ph) => (
            <PhaseCard key={ph.id} phase={ph} deliverables={deliverables.filter((d) => d.phase_id === ph.id)} canManage={manage} />
          ))}
          {!project.has_converted && phases.some((p) => p.status === "approved") && manage && (
            <ConvertPanel projectId={project.id} />
          )}
          {project.has_converted && project.converted_execution_project_id && (
            <div className="card border-emerald-200 bg-emerald-50 p-5 text-sm">
              ✅ Design approved & converted to execution.{" "}
              <Link className="font-semibold underline" href={`/projects/${project.converted_execution_project_id}`}>
                Open execution project →
              </Link>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Milestones & Billing Schedule</h2>
          <MilestoneTable milestones={milestones} showMoney={money} canManage={manage || profile.role === "finance"} />
        </section>
      )}

      {project.description && (
        <div className="card p-5">
          <p className="stat-label mb-2">Scope Summary</p>
          <p className="text-sm text-neutral-700">{project.description}</p>
        </div>
      )}
    </div>
  );
}
