"use client";
import { useState } from "react";

type Deliverable = { name: string; completed: boolean; file_url: string | null };
type Phase = {
  phase_number: number; title: string; week_timeline: string; description: string | null;
  status: string; approved_by_client: boolean; client_approved_at: string | null;
  mood_board_images: unknown[]; renders_3d: unknown[]; deliverables: Deliverable[];
};
type Milestone = {
  title: string; phase: string | null; due_date: string | null; completed_date: string | null;
  status: string; bill_pct: number; bill_amount: number;
};
type Data = {
  code: string; title: string; client_name: string; location: string | null;
  category: string; status: string; health: string; progress_pct: number;
  current_week: number | null; target_weeks: number | null;
  start_date: string | null; end_date: string | null; company_name: string;
  phases: Phase[]; milestones: Milestone[];
};

const L = {
  en: {
    title: "Track your project", sub: "Enter your project code and the phone number we have on file.",
    code: "Project code", codePh: "AZ-C-001", phone: "Phone number", phonePh: "01XXXXXXXXX",
    go: "View progress", again: "Track another project",
    notfound: "No project matches that code and phone number. Please check both and try again.",
    many: "Too many attempts. Please wait 15 minutes and try again.",
    overall: "Overall progress", week: "Week", of: "of", timeline: "Timeline", to: "to",
    roadmap: "Design roadmap", payments: "Payment schedule", due: "Due", completed: "Completed",
    noPhases: "The design roadmap has not been set up yet.", noMs: "No payment schedule recorded yet.",
    approved: "Approved by you", amount: "Amount", notSet: "Not set",
    pstatus: { design: "Design", procurement: "Procurement", execution: "Execution", finishing: "Finishing", handover: "Handover", completed: "Completed" } as Record<string, string>,
    health: { on_track: "On track", at_risk: "At risk", delayed: "Delayed" } as Record<string, string>,
    phstatus: { not_started: "Not started", in_progress: "In progress", client_review: "Awaiting your review", revision_requested: "Revision requested", approved: "Approved" } as Record<string, string>,
    msstatus: { pending: "Pending", in_progress: "In progress", completed: "Completed", client_approved: "Approved" } as Record<string, string>,
  },
  bn: {
    title: "আপনার প্রজেক্টের অগ্রগতি", sub: "প্রজেক্ট কোড ও আমাদের কাছে থাকা ফোন নম্বরটি দিন।",
    code: "প্রজেক্ট কোড", codePh: "AZ-C-001", phone: "ফোন নম্বর", phonePh: "01XXXXXXXXX",
    go: "অগ্রগতি দেখুন", again: "অন্য প্রজেক্ট দেখুন",
    notfound: "এই কোড ও ফোন নম্বরে কোনো প্রজেক্ট পাওয়া যায়নি। দুটোই মিলিয়ে আবার চেষ্টা করুন।",
    many: "অনেকবার চেষ্টা হয়েছে। ১৫ মিনিট পরে আবার করুন।",
    overall: "সামগ্রিক অগ্রগতি", week: "সপ্তাহ", of: "/", timeline: "সময়সীমা", to: "থেকে",
    roadmap: "ডিজাইন রোডম্যাপ", payments: "পেমেন্ট সূচি", due: "তারিখ", completed: "সম্পন্ন",
    noPhases: "ডিজাইন রোডম্যাপ এখনো সাজানো হয়নি।", noMs: "পেমেন্ট সূচি এখনো যোগ করা হয়নি।",
    approved: "আপনি অনুমোদন দিয়েছেন", amount: "পরিমাণ", notSet: "নির্ধারিত হয়নি",
    pstatus: { design: "ডিজাইন", procurement: "ক্রয়", execution: "নির্মাণ", finishing: "ফিনিশিং", handover: "হস্তান্তর", completed: "সম্পন্ন" } as Record<string, string>,
    health: { on_track: "ঠিক পথে", at_risk: "ঝুঁকিতে", delayed: "বিলম্বিত" } as Record<string, string>,
    phstatus: { not_started: "শুরু হয়নি", in_progress: "চলছে", client_review: "আপনার মতামতের অপেক্ষায়", revision_requested: "সংশোধন চাওয়া হয়েছে", approved: "অনুমোদিত" } as Record<string, string>,
    msstatus: { pending: "বাকি", in_progress: "চলছে", completed: "সম্পন্ন", client_approved: "অনুমোদিত" } as Record<string, string>,
  },
};

const money = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const dt = (d: string | null, lang: string) =>
  d ? new Date(d).toLocaleDateString(lang === "bn" ? "en-GB" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const healthTone: Record<string, string> = {
  on_track: "border-emerald-200 bg-emerald-50 text-emerald-700",
  at_risk: "border-amber-200 bg-amber-50 text-amber-700",
  delayed: "border-rose-200 bg-rose-50 text-rose-700",
};
const phaseTone: Record<string, string> = {
  not_started: "border-neutral-200 bg-neutral-50 text-neutral-600",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  client_review: "border-violet-200 bg-violet-50 text-violet-700",
  revision_requested: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function imgUrls(raw: unknown[]): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x : x && typeof x === "object" && "url" in x ? String((x as { url: unknown }).url) : ""))
    .filter((u) => u.startsWith("http"));
}

export default function TrackClient({ initialCode }: { initialCode: string }) {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const t = L[lang];
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, phone }),
    });
    setBusy(false);
    if (r.status === 429) { setErr(t.many); return; }
    if (!r.ok) { setErr(t.notfound); return; }
    setData(await r.json());
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 font-mono text-xs font-bold text-white">AZ</div>
          <div>
            <div className="text-sm font-bold tracking-tight">AZ ARCHITECTS</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Project Tracking</div>
          </div>
        </div>
        <div className="flex gap-1">
          {(["en", "bn"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${lang === l ? "bg-neutral-950 text-white" : "border border-neutral-300 text-neutral-600"}`}>
              {l === "en" ? "EN" : "বাং"}
            </button>
          ))}
        </div>
      </header>

      {!data && (
        <div className="card mx-auto max-w-md p-6">
          <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 mb-5 text-sm text-neutral-500">{t.sub}</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t.code}</label>
              <input className="input font-mono uppercase" value={code} placeholder={t.codePh}
                onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t.phone}</label>
              <input className="input" value={phone} placeholder={t.phonePh} inputMode="tel"
                onChange={(e) => setPhone(e.target.value)} required />
            </div>
            {err && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
            <button className="btn w-full" disabled={busy || !code || !phone}>{busy ? "…" : t.go}</button>
          </form>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mono text-neutral-400">{data.code}</div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">{data.title}</h1>
                <p className="text-sm text-neutral-500">
                  {data.client_name}{data.location ? ` · ${data.location}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge border-neutral-300 bg-neutral-100 text-neutral-700">
                  {t.pstatus[data.status] ?? data.status}
                </span>
                <span className={`badge ${healthTone[data.health] ?? "border-neutral-200 bg-neutral-50 text-neutral-600"}`}>
                  {t.health[data.health] ?? data.health}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-end justify-between">
                <span className="stat-label">{t.overall}</span>
                <span className="text-2xl font-bold tracking-tight">{data.progress_pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full rounded-full bg-neutral-950 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, data.progress_pct))}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="stat-label">{t.timeline}</div>
                <div className="mt-1 text-sm font-semibold">
                  {data.start_date ? `${dt(data.start_date, lang)} ${t.to} ${dt(data.end_date, lang) || "—"}` : t.notSet}
                </div>
              </div>
              {data.target_weeks ? (
                <div>
                  <div className="stat-label">{t.week}</div>
                  <div className="mt-1 text-sm font-semibold">
                    {data.current_week ?? 1} {t.of} {data.target_weeks}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">{t.roadmap}</h2>
            {data.phases.length === 0 && <p className="card p-6 text-sm text-neutral-500">{t.noPhases}</p>}
            <div className="space-y-4">
              {data.phases.map((ph) => {
                const imgs = [...imgUrls(ph.renders_3d), ...imgUrls(ph.mood_board_images)];
                const done = ph.deliverables.filter((d) => d.completed).length;
                return (
                  <div key={ph.phase_number} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-mono text-xs font-bold text-neutral-600">
                          P{ph.phase_number}
                        </div>
                        <div>
                          <div className="font-semibold">{ph.title}</div>
                          <div className="text-xs text-neutral-500">
                            {ph.week_timeline} · {done}/{ph.deliverables.length} {t.completed.toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${phaseTone[ph.status] ?? "border-neutral-200 bg-neutral-50 text-neutral-600"}`}>
                        {t.phstatus[ph.status] ?? ph.status}
                      </span>
                    </div>

                    {ph.description && <p className="mt-3 text-sm text-neutral-600">{ph.description}</p>}

                    {ph.deliverables.length > 0 && (
                      <ul className="mt-4 space-y-1.5">
                        {ph.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className={d.completed ? "text-emerald-600" : "text-neutral-300"}>{d.completed ? "✓" : "○"}</span>
                            <span className={d.completed ? "text-neutral-400 line-through" : "text-neutral-700"}>{d.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {imgs.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {imgs.map((u, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={u} alt="" loading="lazy"
                            className="aspect-[4/3] w-full rounded-lg border border-neutral-200 object-cover" />
                        ))}
                      </div>
                    )}

                    {ph.approved_by_client && (
                      <div className="mt-3 text-xs font-semibold text-emerald-600">
                        ✔ {t.approved}{ph.client_approved_at ? ` · ${dt(ph.client_approved_at, lang)}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">{t.payments}</h2>
            {data.milestones.length === 0 ? (
              <p className="card p-6 text-sm text-neutral-500">{t.noMs}</p>
            ) : (
              <div className="table-wrap">
                <table className="w-full">
                  <tbody className="divide-y divide-neutral-100">
                    {data.milestones.map((m, i) => (
                      <tr key={i}>
                        <td className="td">
                          <div className="font-semibold">{m.title}</div>
                          <div className="text-xs text-neutral-500">
                            {m.completed_date
                              ? `${t.completed} · ${dt(m.completed_date, lang)}`
                              : m.due_date ? `${t.due} · ${dt(m.due_date, lang)}` : ""}
                          </div>
                        </td>
                        <td className="td text-right whitespace-nowrap">
                          <div className="font-semibold">{money(m.bill_amount)}</div>
                          {Number(m.bill_pct) > 0 && <div className="text-xs text-neutral-500">{m.bill_pct}%</div>}
                        </td>
                        <td className="td text-right">
                          <span className={`badge ${m.status === "completed" || m.status === "client_approved"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-neutral-200 bg-neutral-50 text-neutral-600"}`}>
                            {t.msstatus[m.status] ?? m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <button className="btn-ghost w-full" onClick={() => { setData(null); setPhone(""); setErr(null); }}>
            {t.again}
          </button>
        </div>
      )}

      <footer className="mt-10 text-center font-mono text-[10px] uppercase tracking-wider text-neutral-400">
        {data?.company_name ?? "AZ Architects"}
      </footer>
    </main>
  );
}
