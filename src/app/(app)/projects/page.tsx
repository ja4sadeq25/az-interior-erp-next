import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { fmtDate, statusColor } from "@/lib/format";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  const profile = await requireProfile();
  const t = await getDict();
  const { cat, q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (cat === "consultancy" || cat === "execution") query = query.eq("category", cat);
  if (q) query = query.or(`title.ilike.%${q}%,client_name.ilike.%${q}%,code.ilike.%${q}%`);
  const { data } = await query;
  const list = (data ?? []) as Project[];
  const canCreate = ["master", "admin", "project_manager"].includes(profile.role);

  const tabs = [
    { key: "", label: t.projects.tabAll },
    { key: "consultancy", label: t.projects.tabConsultancy },
    { key: "execution", label: t.projects.tabExecution },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono text-neutral-400 dark:text-neutral-500">{t.projects.kicker}</p>
          <h1 className="text-2xl font-bold tracking-tight">{t.projects.heading}</h1>
        </div>
        {canCreate && (
          <Link href="/projects/new" className="btn">{t.projects.newProject}</Link>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t2) => (
          <Link
            key={t2.key}
            href={`/projects${t2.key ? `?cat=${t2.key}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              (cat ?? "") === t2.key
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {t2.label}
          </Link>
        ))}
        <form action="/projects" className="ml-auto flex items-center gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" defaultValue={q ?? ""} placeholder={t.common.searchPlaceholder} className="input w-44 py-1.5" />
          <button className="btn-ghost px-3 py-1.5 text-xs">{t.common.search}</button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500 dark:text-neutral-400">{t.projects.noFound}</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[760px]">
            <thead className="table-head">
              <tr>
                <th className="th">{t.projects.thCode}</th>
                <th className="th">{t.projects.thProject}</th>
                <th className="th">{t.projects.thClient}</th>
                <th className="th">{t.projects.thType}</th>
                <th className="th">{t.projects.thStatus}</th>
                <th className="th">{t.projects.thHealth}</th>
                <th className="th">{t.projects.thTimeline}</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {list.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="td mono">{p.code}</td>
                  <td className="td">
                    <Link href={`/projects/${p.id}`} className="font-semibold hover:underline">{p.title}</Link>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{t.category[p.category]}</p>
                  </td>
                  <td className="td">{p.client_name}</td>
                  <td className="td">{t.ptype[p.ptype]}</td>
                  <td className="td"><span className={`badge ${statusColor(p.status)}`}>{t.status[p.status]}</span></td>
                  <td className="td"><span className={`badge ${statusColor(p.health)}`}>{t.status[p.health]}</span></td>
                  <td className="td text-xs text-neutral-500 dark:text-neutral-400">{fmtDate(p.start_date)} → {fmtDate(p.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
