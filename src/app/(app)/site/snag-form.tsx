"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSnag } from "@/app/actions/site";
import { useT } from "@/components/providers";

export default function SnagForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
  const t = useT();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setErr(null); setOk(false);
    start(async () => {
      const res = await addSnag(Object.fromEntries(fd) as never);
      if (res.error) setErr(res.error);
      else { setOk(true); router.refresh(); }
    });
  }

  return (
    <form action={submit} className="card space-y-3 p-5">
      <h3 className="font-semibold">{t.site.snagTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t.site.projectReq}</label>
          <select name="project_id" className="input" required>
            <option value="">{t.common.select}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div><label className="label">{t.site.space}</label><input name="space_name" className="input" placeholder={t.site.spacePh} /></div>
        <div>
          <label className="label">{t.site.priority}</label>
          <select name="priority" className="input" defaultValue="medium">
            <option value="low">{t.status.low}</option>
            <option value="medium">{t.status.medium}</option>
            <option value="high">{t.status.high}</option>
            <option value="urgent">{t.status.urgent}</option>
          </select>
        </div>
        <div><label className="label">{t.site.assignedTo}</label><input name="assigned_to" className="input" /></div>
      </div>
      <div>
        <label className="label">{t.site.descriptionReq}</label>
        <textarea name="description" className="textarea" rows={3} required placeholder={t.site.descriptionPh} />
      </div>
      {err && <p className="alert-error">{err}</p>}
      {ok && <p className="alert-ok">{t.site.snagOk}</p>}
      <button className="btn" disabled={pending}>{pending ? t.site.reporting : t.site.reportSnag}</button>
    </form>
  );
}
