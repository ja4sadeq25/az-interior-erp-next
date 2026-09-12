import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { fmtDate, statusColor } from "@/lib/format";
import type { SecureDocument } from "@/lib/types";
import UploadForm from "./upload-form";
import DocStatusSelect from "./doc-status";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const profile = await requireProfile();
  const t = await getDict();
  const canUpload = ["master", "admin", "architect", "project_manager", "site_engineer"].includes(profile.role);
  const canManage = ["master", "admin", "architect", "project_manager"].includes(profile.role);
  const supabase = await createClient();
  const [docRes, projRes] = await Promise.all([
    supabase.from("documents").select("*, projects(title, code)").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, code, title").order("created_at", { ascending: false }),
  ]);
  const docs = (docRes.data ?? []) as SecureDocument[];
  const projects = (projRes.data ?? []) as { id: string; code: string; title: string }[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono text-neutral-400 dark:text-neutral-500">{t.documents.kicker}</p>
          <h1 className="text-2xl font-bold tracking-tight">{t.documents.heading}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{docs.length} {t.documents.docs} · {t.documents.roleGated}</p>
        </div>
        {canUpload && <UploadForm projects={projects} />}
      </header>

      {docs.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.documents.noDocs}</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[820px]">
            <thead className="table-head">
              <tr>
                <th className="th">{t.documents.thDocument}</th>
                <th className="th">{t.documents.thCategory}</th>
                <th className="th">{t.documents.thProject}</th>
                <th className="th">{t.documents.thType}</th>
                <th className="th">{t.documents.thVersion}</th>
                <th className="th">{t.documents.thUploaded}</th>
                <th className="th">{t.documents.thStatus}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="td">
                    <p className="font-semibold">{d.title}</p>
                    {d.description && <p className="text-xs text-neutral-400 dark:text-neutral-500">{d.description}</p>}
                  </td>
                  <td className="td text-xs">{t.documents.categories[d.category] ?? d.category}</td>
                  <td className="td text-xs">{d.projects?.title ?? "—"}</td>
                  <td className="td mono">{d.file_type} · {d.file_size}</td>
                  <td className="td mono">{d.version}</td>
                  <td className="td text-xs">{fmtDate(d.created_at)}</td>
                  <td className="td">
                    {canManage ? (
                      <DocStatusSelect id={d.id} status={d.status} />
                    ) : (
                      <span className={`badge ${statusColor(d.status)}`}>{t.status[d.status]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
