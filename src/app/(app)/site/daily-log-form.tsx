"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDailyLog } from "@/app/actions/site";

export default function DailyLogForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
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
      <h3 className="font-semibold">Submit Daily Site Log</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Project *</label>
          <select name="project_id" className="input" required>
            <option value="">— Select —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input name="log_date" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <label className="label">Weather</label>
          <select name="weather" className="input">
            <option>Sunny & Clear</option>
            <option>Rainy / Monsoon</option>
            <option>Humid</option>
            <option>Overcast</option>
          </select>
        </div>
        <div><label className="label">Inspected By</label><input name="inspected_by" className="input" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(["carpenters", "masons", "electricians", "painters", "plumbers", "helpers"] as const).map((k) => (
          <div key={k}>
            <label className="label capitalize">{k}</label>
            <input name={k} type="number" min="0" className="input" defaultValue="0" />
          </div>
        ))}
      </div>
      <div>
        <label className="label">Work Completed *</label>
        <textarea name="work_completed" className="textarea" rows={2} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Challenges / Snags</label><textarea name="challenges" className="textarea" rows={2} /></div>
        <div><label className="label">Materials Received</label><textarea name="materials_received" className="textarea" rows={2} /></div>
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Daily log submitted.</p>}
      <button className="btn" disabled={pending}>{pending ? "Submitting…" : "Submit Log"}</button>
    </form>
  );
}
