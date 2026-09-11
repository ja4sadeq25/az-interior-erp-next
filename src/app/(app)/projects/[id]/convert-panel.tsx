"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { convertToExecution } from "@/app/actions/projects";

export default function ConvertPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit(fd: FormData) {
    setErr(null);
    start(async () => {
      const res = await convertToExecution(
        projectId,
        String(fd.get("contract_value") ?? ""),
        String(fd.get("start_date") ?? ""),
        String(fd.get("end_date") ?? "")
      );
      if (res.error) setErr(res.error);
      else if (res.id) router.push(`/projects/${res.id}`);
    });
  }

  if (!open) {
    return (
      <button className="btn-ghost w-full" onClick={() => setOpen(true)}>
        Convert approved design to Turnkey Execution project <ArrowRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form action={submit} className="card space-y-3 border-neutral-900 p-5">
      <h3 className="font-semibold">Convert to Turnkey Execution</h3>
      <p className="text-xs text-neutral-500">
        Creates a new execution project with the standard 5-milestone billing schedule (20/25/25/20/10%).
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Contract Value (৳) *</label>
          <input name="contract_value" className="input" type="number" min="1" required />
        </div>
        <div>
          <label className="label">Start Date</label>
          <input name="start_date" className="input" type="date" />
        </div>
        <div>
          <label className="label">End Date</label>
          <input name="end_date" className="input" type="date" />
        </div>
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <button className="btn" disabled={pending}>{pending ? "Converting…" : "Create Execution Project"}</button>
    </form>
  );
}
