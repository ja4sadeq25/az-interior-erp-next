"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Circle } from "lucide-react";
import { updatePhaseStatus, toggleDeliverable, approvePhase } from "@/app/actions/projects";
import { statusColor } from "@/lib/format";
import { useT } from "@/components/providers";
import DeliverableFiles from "./deliverable-files";
import type { Deliverable, DeliverableFile, DesignPhase } from "@/lib/types";

const PHASE_STATUSES = ["not_started", "in_progress", "client_review", "revision_requested", "approved"];

export default function PhaseCard({ phase, deliverables, files, urls, canManage, canDelete, projectId }: {
  phase: DesignPhase; deliverables: Deliverable[]; files: DeliverableFile[];
  urls: Record<string, string>; canManage: boolean; canDelete: boolean; projectId: string;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState("");
  const done = deliverables.filter((d) => d.completed).length;

  function setStatus(status: string) {
    start(async () => { await updatePhaseStatus(phase.id, status); router.refresh(); });
  }
  function toggle(d: Deliverable) {
    start(async () => { await toggleDeliverable(d.id, !d.completed); router.refresh(); });
  }
  function approve() {
    start(async () => { await approvePhase(phase.id, feedback); router.refresh(); });
  }

  return (
    <div className={`card p-5 ${phase.status === "approved" ? "border-emerald-200 dark:border-emerald-900" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="mono rounded-lg bg-neutral-950 px-2.5 py-1 text-white dark:bg-white dark:text-neutral-950">P{phase.phase_number}</span>
          <div>
            <h3 className="font-semibold leading-snug">{phase.title}</h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{phase.week_timeline} · {done}/{deliverables.length} {t.projectDetail.deliverablesDone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${statusColor(phase.status)}`}>{t.status[phase.status]}</span>
          {canManage && phase.status !== "approved" && (
            <select
              className="select w-44 py-1.5 text-xs"
              value={phase.status}
              disabled={pending}
              onChange={(e) => setStatus(e.target.value)}
            >
              {PHASE_STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
            </select>
          )}
        </div>
      </div>

      {phase.description && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{phase.description}</p>}

      {deliverables.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {deliverables.map((d) => (
            <li key={d.id} className="text-sm">
              <div className="flex items-start gap-2">
              {canManage && phase.status !== "approved" ? (
                <button onClick={() => toggle(d)} className="mt-0.5 text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white">
                  {d.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Circle className="h-4 w-4" />}
                </button>
              ) : d.completed ? (
                <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 text-neutral-300 dark:text-neutral-600" />
              )}
              <span className={d.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-300"}>{d.name}</span>
              </div>
              <DeliverableFiles
                projectId={projectId}
                phaseId={phase.id}
                deliverableId={d.id}
                files={files.filter((f) => f.deliverable_id === d.id)}
                urls={urls}
                canManage={canManage}
                canDelete={canDelete}
                locked={phase.status === "approved"}
              />
            </li>
          ))}
        </ul>
      )}

      {canManage && phase.status === "client_review" && !phase.approved_by_client && (
        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/40">
          <label className="label">{t.projectDetail.clientFeedback}</label>
          <div className="flex gap-2">
            <input className="input" placeholder={t.projectDetail.clientFeedbackPh} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <button className="btn" onClick={approve} disabled={pending}>{t.projectDetail.approve}</button>
          </div>
        </div>
      )}
      {phase.approved_by_client && (
        <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">
          {t.projectDetail.clientApproved}{phase.client_feedback ? ` — “${phase.client_feedback}”` : ""}
        </p>
      )}
    </div>
  );
}
