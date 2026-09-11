"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { convertToExecution } from "@/app/actions/projects";
import { useT } from "@/components/providers";

export default function ConvertPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const t = useT();
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
        {t.projectDetail.convertCta} <ArrowRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form action={submit} className="card space-y-3 border-neutral-900 p-5 dark:border-neutral-500">
      <h3 className="font-semibold">{t.projectDetail.convertTitle}</h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {t.projectDetail.convertDesc}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">{t.projectDetail.contractValueReq}</label>
          <input name="contract_value" className="input" type="number" min="1" required />
        </div>
        <div>
          <label className="label">{t.common.startDate}</label>
          <input name="start_date" className="input" type="date" />
        </div>
        <div>
          <label className="label">{t.common.endDate}</label>
          <input name="end_date" className="input" type="date" />
        </div>
      </div>
      {err && <p className="alert-error">{err}</p>}
      <button className="btn" disabled={pending}>{pending ? t.projectDetail.converting : t.projectDetail.createExecution}</button>
    </form>
  );
}
