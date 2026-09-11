"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePoStatus } from "@/app/actions/procurement";
import { statusColor } from "@/lib/format";
import { useT } from "@/components/providers";

const STATUSES = ["draft", "pending_approval", "approved", "dispatched", "delivered", "cancelled"];

export default function PoStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <select
      className={`select py-1.5 text-xs ${statusColor(status)}`}
      value={status}
      disabled={pending}
      onChange={(e) => start(async () => { await updatePoStatus(id, e.target.value); router.refresh(); })}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
    </select>
  );
}
