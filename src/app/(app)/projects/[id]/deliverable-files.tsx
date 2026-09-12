"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { uploadDeliverableFile, setFileVisibility, deleteDeliverableFile } from "@/app/actions/deliverable-files";
import { useT } from "@/components/providers";
import type { DeliverableFile } from "@/lib/types";

export default function DeliverableFiles({
  projectId, phaseId, deliverableId, files, urls, canManage, canDelete, locked,
}: {
  projectId: string; phaseId: string; deliverableId: string;
  files: DeliverableFile[]; urls: Record<string, string>;
  canManage: boolean; canDelete: boolean; locked: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [visible, setVisible] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setErr(t.files.pickFile); return; }
    setErr(null);
    start(async () => {
      const r = await uploadDeliverableFile({
        project_id: projectId, phase_id: phaseId, deliverable_id: deliverableId,
        caption, client_visible: visible, file,
      });
      if (r?.error) { setErr(r.error); return; }
      setCaption(""); setOpen(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="mt-1.5 ml-6">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f) => {
            const url = urls[f.storage_path];
            const isImg = (f.mime ?? "").startsWith("image/");
            return (
              <div key={f.id} className="group relative">
                <a href={url} target="_blank" rel="noreferrer" title={f.caption ?? f.file_name}
                  className="block h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                  {isImg && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={f.caption ?? f.file_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-400">
                      <FileText className="h-5 w-5" />
                    </span>
                  )}
                </a>
                <span
                  title={f.client_visible ? t.files.shown : t.files.hidden}
                  className={`absolute -right-1 -top-1 rounded-full border p-0.5 ${f.client_visible
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                    : "border-neutral-300 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"}`}>
                  {f.client_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </span>
                {canManage && (
                  <div className="absolute inset-x-0 -bottom-1 hidden justify-center gap-1 group-hover:flex">
                    <button
                      onClick={() => start(async () => { await setFileVisibility(f.id, projectId, !f.client_visible); router.refresh(); })}
                      disabled={pending}
                      className="rounded bg-neutral-950/90 px-1 py-0.5 text-[9px] font-semibold text-white">
                      {f.client_visible ? t.files.hide : t.files.show}
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => start(async () => { await deleteDeliverableFile(f.id, projectId); router.refresh(); })}
                        disabled={pending}
                        className="rounded bg-rose-600/90 px-1 py-0.5 text-white">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManage && !locked && !open && (
        <button onClick={() => setOpen(true)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
          <Paperclip className="h-3 w-3" /> {t.files.attach}
        </button>
      )}

      {open && (
        <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <input ref={inputRef} type="file" accept="image/*,application/pdf"
            className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-neutral-950 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white dark:file:bg-white dark:file:text-neutral-950" />
          <input className="input mt-2 py-1.5 text-xs" placeholder={t.files.captionPh}
            value={caption} onChange={(e) => setCaption(e.target.value)} />
          <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            {t.files.showToClient}
          </label>
          {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
          <div className="mt-2 flex gap-2">
            <button className="btn px-3 py-1.5 text-xs" onClick={submit} disabled={pending}>
              <Upload className="h-3 w-3" /> {pending ? t.files.uploading : t.files.upload}
            </button>
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setOpen(false); setErr(null); }} disabled={pending}>
              {t.files.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
