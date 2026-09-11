"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMilestoneStatus } from "@/app/actions/projects";
import { bdt, fmtDate, STATUS_LABEL, statusColor } from "@/lib/format";
import type { Milestone } from "@/lib/types";

export default function MilestoneTable({ milestones, showMoney, canManage }: {
  milestones: Milestone[]; showMoney: boolean; canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (milestones.length === 0) {
    return <div className="card p-8 text-center text-sm text-neutral-500">No milestones yet.</div>;
  }

  function setStatus(id: string, status: string) {
    start(async () => { await updateMilestoneStatus(id, status); router.refresh(); });
  }

  return (
    <div className="table-wrap">
      <table className="w-full min-w-[700px]">
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr>
            <th className="th">Milestone</th>
            <th className="th">Due</th>
            <th className="th">Bill %</th>
            <th className="th">Bill Amount</th>
            <th className="th">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {milestones.map((m) => (
            <tr key={m.id}>
              <td className="td">
                <p className="font-semibold">{m.title}</p>
                <p className="text-xs text-neutral-400">{m.phase} · {m.deliverables.join(", ")}</p>
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
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`badge ${statusColor(m.status)}`}>{STATUS_LABEL[m.status]}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
