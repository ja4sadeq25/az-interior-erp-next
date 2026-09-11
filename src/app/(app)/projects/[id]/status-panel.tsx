"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus } from "@/app/actions/projects";
import { useT } from "@/components/providers";
import type { Project } from "@/lib/types";

export default function StatusPanel({ project }: { project: Project }) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string>(project.status);
  const [health, setHealth] = useState<string>(project.health);
  const [progress, setProgress] = useState(String(project.progress_pct));

  function save() {
    start(async () => {
      await updateProjectStatus(project.id, status, health, progress);
      router.refresh();
    });
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div>
        <label className="label">{t.projectDetail.status}</label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["design", "procurement", "execution", "finishing", "handover", "completed"].map((s) => (
            <option key={s} value={s}>{t.status[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t.projectDetail.health}</label>
        <select className="select" value={health} onChange={(e) => setHealth(e.target.value)}>
          <option value="on_track">{t.status.on_track}</option>
          <option value="at_risk">{t.status.at_risk}</option>
          <option value="delayed">{t.status.delayed}</option>
        </select>
      </div>
      <div>
        <label className="label">{t.projectDetail.progressPct}</label>
        <input className="input w-20" type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} />
      </div>
      <button className="btn" onClick={save} disabled={pending}>{pending ? t.common.saving : t.common.save}</button>
    </div>
  );
}
