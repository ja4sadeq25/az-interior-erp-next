"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/app/actions/documents";
import { useT } from "@/components/providers";

export default function UploadForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
  const t = useT();
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

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>{t.documents.uploadDoc}</button>;

  return (
    <form action={submit} className="card w-full max-w-xl space-y-3 p-5">
      <h3 className="font-semibold">{t.documents.uploadTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">{t.documents.titleReq}</label><input name="title" className="input" required /></div>
        <div>
          <label className="label">{t.documents.project}</label>
          <select name="project_id" className="input">
            <option value="">{t.common.none}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t.documents.category}</label>
          <select name="category" className="input">
            <option value="blueprint">{t.documents.categories.blueprint}</option>
            <option value="3d_render">{t.documents.categories["3d_render"]}</option>
            <option value="structural_cad">{t.documents.categories.structural_cad}</option>
            <option value="vendor_contract">{t.documents.categories.vendor_contract}</option>
            <option value="client_agreement">{t.documents.categories.client_agreement}</option>
            <option value="compliance_noc">{t.documents.categories.compliance_noc}</option>
          </select>
        </div>
        <div><label className="label">{t.documents.version}</label><input name="version" className="input" defaultValue="v1.0" /></div>
        <div><label className="label">{t.documents.fileReq}</label><input name="file" type="file" required className="input text-xs" /></div>
        <div className="sm:col-span-2"><label className="label">{t.documents.description}</label><input name="description" className="input" /></div>
      </div>
      {err && <p className="alert-error">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? t.documents.uploading : t.documents.upload}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
