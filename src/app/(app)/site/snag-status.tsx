"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSnagStatus } from "@/app/actions/site";
import { STATUS_LABEL, statusColor } from "@/lib/format";

const STATUSES = ["open", "in_progress", "resolved"];

export default function SnagStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      className={`select py-1.5 text-xs ${statusColor(status)}`}
      value={status}
      disabled={pending}
      onChange={(e) => start(async () => { await updateSnagStatus(id, e.target.value); router.refresh(); })}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  );
}
