"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDailyLog } from "@/app/actions/site";
import { useT } from "@/components/providers";

export default function DailyLogForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
  const t = useT();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setErr(null); setOk(false);
    start(async () => {
      const res = await addDailyLog(Object.fromEntries(fd) as never);
      if (res.error) setErr(res.error);
      else { setOk(true); router.refresh(); }
    });
  }

  return (
    <form action={submit} className="card space-y-3 p-5">
      <h3 className="font-semibold">{t.site.logTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t.site.projectReq}</label>
          <select name="project_id" className="input" required>
            <option value="">{t.common.select}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t.site.date}</label>
          <input name="log_date" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <label className="label">{t.site.weather}</label>
          <select name="weather" className="input">
            <option>{t.site.wSunny}</option>
            <option>{t.site.wRainy}</option>
            <option>{t.site.wHumid}</option>
            <option>{t.site.wOvercast}</option>
          </select>
        </div>
        <div><label className="label">{t.site.inspectedBy}</label><input name="inspected_by" className="input" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(["carpenters", "masons", "electricians", "painters", "plumbers", "helpers"] as const).map((k) => (
          <div key={k}>
            <label className="label capitalize">{t.site.workers[k]}</label>
            <input name={k} type="number" min="0" className="input" defaultValue="0" />
          </div>
        ))}
      </div>
      <div>
        <label className="label">{t.site.workCompleted}</label>
        <textarea name="work_completed" className="textarea" rows={2} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">{t.site.challenges}</label><textarea name="challenges" className="textarea" rows={2} /></div>
        <div><label className="label">{t.site.materialsReceived}</label><textarea name="materials_received" className="textarea" rows={2} /></div>
      </div>
      {err && <p className="alert-error">{err}</p>}
      {ok && <p className="alert-ok">{t.site.logOk}</p>}
      <button className="btn" disabled={pending}>{pending ? t.site.submitting : t.site.submitLog}</button>
    </form>
  );
}
