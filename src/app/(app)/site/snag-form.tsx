"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSnag } from "@/app/actions/site";

export default function SnagForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
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
      <h3 className="font-semibold">Report a Snag</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Project *</label>
          <select name="project_id" className="input" required>
            <option value="">— Select —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div><label className="label">Space</label><input name="space_name" className="input" placeholder="Master Bedroom" /></div>
        <div>
          <label className="label">Priority</label>
          <select name="priority" className="input" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div><label className="label">Assigned To</label><input name="assigned_to" className="input" /></div>
      </div>
      <div>
        <label className="label">Description *</label>
        <textarea name="description" className="textarea" rows={3} required placeholder="e.g. Hairline crack on fluted panel beside wardrobe…" />
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Snag reported.</p>}
      <button className="btn" disabled={pending}>{pending ? "Reporting…" : "Report Snag"}</button>
    </form>
  );
}
