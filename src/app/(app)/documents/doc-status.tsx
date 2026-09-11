"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDocStatus } from "@/app/actions/documents";
import { STATUS_LABEL, statusColor } from "@/lib/format";

const STATUSES = ["draft", "under_review", "approved", "construction_ready"];

export default function DocStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      className={`select py-1.5 text-xs ${statusColor(status)}`}
      value={status}
      disabled={pending}
      onChange={(e) => start(async () => { await updateDocStatus(id, e.target.value); router.refresh(); })}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  );
}
