"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/app/actions/documents";

export default function UploadForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setErr(null);
    start(async () => {
      const file = fd.get("file") as File | null;
      const res = await uploadDocument({
        title: String(fd.get("title") ?? ""),
        project_id: String(fd.get("project_id") ?? ""),
        category: String(fd.get("category") ?? "blueprint"),
        version: String(fd.get("version") ?? "v1.0"),
        description: String(fd.get("description") ?? ""),
        file: file as File,
      });
      if (res.error) setErr(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>+ Upload Document</button>;

  return (
    <form action={submit} className="card w-full max-w-xl space-y-3 p-5">
      <h3 className="font-semibold">Upload Document</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Title *</label><input name="title" className="input" required /></div>
        <div>
          <label className="label">Project</label>
          <select name="project_id" className="input">
            <option value="">— None —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" className="input">
            <option value="blueprint">Blueprint / Drawings</option>
            <option value="3d_render">3D Renders</option>
            <option value="structural_cad">Structural / MEP CAD</option>
            <option value="vendor_contract">Vendor Contracts</option>
            <option value="client_agreement">Client Agreements</option>
            <option value="compliance_noc">Compliance / NOC</option>
          </select>
        </div>
        <div><label className="label">Version</label><input name="version" className="input" defaultValue="v1.0" /></div>
        <div><label className="label">File *</label><input name="file" type="file" required className="input text-xs" /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><input name="description" className="input" /></div>
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? "Uploading…" : "Upload"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
