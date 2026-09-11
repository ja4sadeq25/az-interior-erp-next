import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { fmtDate, STATUS_LABEL, statusColor } from "@/lib/format";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  const profile = await requireProfile();
  const { cat, q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (cat === "consultancy" || cat === "execution") query = query.eq("category", cat);
  if (q) query = query.or(`title.ilike.%${q}%,client_name.ilike.%${q}%,code.ilike.%${q}%`);
  const { data } = await query;
  const list = (data ?? []) as Project[];
  const canCreate = ["master", "admin", "project_manager"].includes(profile.role);

  const tabs = [
    { key: "", label: "All" },
    { key: "consultancy", label: "Consultancy (Design)" },
    { key: "execution", label: "Execution (Turnkey)" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono text-neutral-400">Portfolio</p>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        </div>
        {canCreate && (
          <Link href="/projects/new" className="btn">+ New Project</Link>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/projects${t.key ? `?cat=${t.key}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              (cat ?? "") === t.key
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
        <form action="/projects" className="ml-auto flex items-center gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" defaultValue={q ?? ""} placeholder="Search…" className="input w-44 py-1.5" />
          <button className="btn-ghost px-3 py-1.5 text-xs">Search</button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center text-sm text-neutral-500">No projects found.</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="th">Code</th>
                <th className="th">Project</th>
                <th className="th">Client</th>
                <th className="th">Type</th>
                <th className="th">Status</th>
                <th className="th">Health</th>
                <th className="th">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {list.map((p) => (
                <tr key={p.id} className="transition hover:bg-neutral-50">
                  <td className="td mono">{p.code}</td>
                  <td className="td">
                    <Link href={`/projects/${p.id}`} className="font-semibold hover:underline">{p.title}</Link>
                    <p className="text-xs text-neutral-400 capitalize">{p.category}</p>
                  </td>
                  <td className="td">{p.client_name}</td>
                  <td className="td capitalize">{p.ptype}</td>
                  <td className="td"><span className={`badge ${statusColor(p.status)}`}>{STATUS_LABEL[p.status]}</span></td>
                  <td className="td"><span className={`badge ${statusColor(p.health)}`}>{STATUS_LABEL[p.health]}</span></td>
                  <td className="td text-xs text-neutral-500">{fmtDate(p.start_date)} → {fmtDate(p.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
