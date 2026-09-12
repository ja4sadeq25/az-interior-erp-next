"use client";
import { useState } from "react";
import { Eye, EyeOff, FileText } from "lucide-react";
import { useT } from "@/components/providers";
import type { DeliverableFile, DesignPhase } from "@/lib/types";

export default function ProjectGallery({ files, urls, phases }: {
  files: DeliverableFile[]; urls: Record<string, string>; phases: DesignPhase[];
}) {
  const t = useT();
  const [onlyClient, setOnlyClient] = useState(false);
  const shown = onlyClient ? files.filter((f) => f.client_visible) : files;
  const phaseOf = (id: string | null) => phases.find((p) => p.id === id);

  if (files.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {t.files.gallery} · {files.length}
        </h2>
        <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={onlyClient} onChange={(e) => setOnlyClient(e.target.checked)} />
          {t.files.onlyClientVisible}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((f) => {
          const ph = phaseOf(f.phase_id);
          const url = urls[f.storage_path];
          const isImg = (f.mime ?? "").startsWith("image/");
          return (
            <a key={f.id} href={url} target="_blank" rel="noreferrer" className="card overflow-hidden transition hover:shadow-md">
              <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-900">
                {isImg && url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={f.caption ?? f.file_name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-neutral-400">
                    <FileText className="h-8 w-8" />
                  </span>
                )}
                <span className={`absolute right-2 top-2 rounded-full border p-1 ${f.client_visible
                  ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                  : "border-neutral-300 bg-white/90 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/90"}`}>
                  {f.client_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold">{f.caption || f.file_name}</p>
                <p className="mono mt-0.5 truncate text-neutral-400 dark:text-neutral-500">
                  {ph ? `P${ph.phase_number} · ` : ""}{new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
