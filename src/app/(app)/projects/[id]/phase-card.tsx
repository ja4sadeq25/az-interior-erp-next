"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Circle } from "lucide-react";
import { updatePhaseStatus, toggleDeliverable, approvePhase } from "@/app/actions/projects";
import { STATUS_LABEL, statusColor } from "@/lib/format";
import type { Deliverable, DesignPhase } from "@/lib/types";

const PHASE_STATUSES = ["not_started", "in_progress", "client_review", "revision_requested", "approved"];

export default function PhaseCard({ phase, deliverables, canManage }: {
  phase: DesignPhase; deliverables: Deliverable[]; canManage: boolean;
}) {
  const router = useRouter();
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
    <div className={`card p-5 ${phase.status === "approved" ? "border-emerald-200" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="mono rounded-lg bg-neutral-950 px-2.5 py-1 text-white">P{phase.phase_number}</span>
          <div>
            <h3 className="font-semibold leading-snug">{phase.title}</h3>
            <p className="text-[11px] text-neutral-400">{phase.week_timeline} · {done}/{deliverables.length} deliverables done</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${statusColor(phase.status)}`}>{STATUS_LABEL[phase.status]}</span>
          {canManage && phase.status !== "approved" && (
            <select
              className="select w-44 py-1.5 text-xs"
              value={phase.status}
              disabled={pending}
              onChange={(e) => setStatus(e.target.value)}
            >
              {PHASE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          )}
        </div>
      </div>

      {phase.description && <p className="mt-2 text-xs text-neutral-500">{phase.description}</p>}

      {deliverables.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {deliverables.map((d) => (
            <li key={d.id} className="flex items-start gap-2 text-sm">
              {canManage && phase.status !== "approved" ? (
                <button onClick={() => toggle(d)} className="mt-0.5 text-neutral-400 hover:text-neutral-900">
                  {d.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4" />}
                </button>
              ) : d.completed ? (
                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 text-neutral-300" />
              )}
              <span className={d.completed ? "text-neutral-400 line-through" : "text-neutral-700"}>{d.name}</span>
            </li>
          ))}
        </ul>
      )}

      {canManage && phase.status === "client_review" && !phase.approved_by_client && (
        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3">
          <label className="label">Client feedback (record sign-off)</label>
          <div className="flex gap-2">
            <input className="input" placeholder="Client approved the deliverables…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <button className="btn" onClick={approve} disabled={pending}>Approve</button>
          </div>
        </div>
      )}
      {phase.approved_by_client && (
        <p className="mt-3 text-xs text-emerald-700">
          ✔ Client approved{phase.client_feedback ? ` — “${phase.client_feedback}”` : ""}
        </p>
      )}
    </div>
  );
}
