"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMilestoneStatus } from "@/app/actions/projects";
import { bdt, fmtDate, statusColor } from "@/lib/format";
import { useT } from "@/components/providers";
import type { Milestone } from "@/lib/types";

export default function MilestoneTable({ milestones, showMoney, canManage }: {
  milestones: Milestone[]; showMoney: boolean; canManage: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();

  if (milestones.length === 0) {
    return <div className="card p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.projectDetail.noMilestones}</div>;
  }

  function setStatus(id: string, status: string) {
    start(async () => { await updateMilestoneStatus(id, status); router.refresh(); });
  }

  return (
    <div className="table-wrap">
      <table className="w-full min-w-[700px]">
        <thead className="table-head">
          <tr>
            <th className="th">{t.projectDetail.msMilestone}</th>
            <th className="th">{t.projectDetail.msDue}</th>
            <th className="th">{t.projectDetail.msBillPct}</th>
            <th className="th">{t.projectDetail.msBillAmount}</th>
            <th className="th">{t.projectDetail.msStatus}</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {milestones.map((m) => (
            <tr key={m.id}>
              <td className="td">
                <p className="font-semibold">{m.title}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{m.phase} · {m.deliverables.join(", ")}</p>
              </td>
              <td className="td text-xs">{fmtDate(m.due_date)}</td>
              <td className="td mono">{Number(m.bill_pct)}%</td>
              <td className="td">{showMoney ? bdt(m.bill_amount) : "••••••"}</td>
              <td className="td">
                {canManage ? (
                  <select
                    className={`select py-1.5 text-xs ${statusColor(m.status)}`}
                    value={m.status}
                    disabled={pending}
                    onChange={(e) => setStatus(m.id, e.target.value)}
                  >
                    {["pending", "in_progress", "completed", "client_approved"].map((s) => (
                      <option key={s} value={s}>{t.status[s]}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`badge ${statusColor(m.status)}`}>{t.status[m.status]}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
