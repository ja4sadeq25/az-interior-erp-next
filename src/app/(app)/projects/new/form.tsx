"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { useT } from "@/components/providers";

export default function ProjectForm() {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [category, setCategory] = useState<"consultancy" | "execution">("consultancy");
  const [err, setErr] = useState<string | null>(null);

  function submit(fd: FormData) {
    setErr(null);
    start(async () => {
      const res = await createProject(Object.fromEntries(fd) as never);
      if (res.error) setErr(res.error);
      else if (res.id) router.push(`/projects/${res.id}`);
    });
  }

  return (
    <form action={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">{t.newProject.category}</label>
        <div className="grid grid-cols-2 gap-2">
          {(["consultancy", "execution"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                category === c
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                  : "border-neutral-300 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300"
              }`}
            >
              {c === "consultancy" ? t.newProject.catConsultancy : t.newProject.catExecution}
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="category" value={category} />

      <div>
        <label className="label">{t.newProject.title}</label>
        <input name="title" className="input" required placeholder={t.newProject.titlePh} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.newProject.clientNameReq}</label>
          <input name="client_name" className="input" required />
        </div>
        <div>
          <label className="label">{t.newProject.clientPhone}</label>
          <input name="client_phone" className="input" placeholder={t.newProject.clientPhonePh} />
        </div>
        <div>
          <label className="label">{t.newProject.clientEmail}</label>
          <input name="client_email" className="input" type="email" />
        </div>
        <div>
          <label className="label">{t.newProject.location}</label>
          <input name="location" className="input" placeholder={t.newProject.locationPh} />
        </div>
        <div>
          <label className="label">{t.newProject.ptype}</label>
          <select name="ptype" className="input" defaultValue="residential">
            <option value="residential">{t.ptype.residential}</option>
            <option value="commercial">{t.ptype.commercial}</option>
            <option value="hospitality">{t.ptype.hospitality}</option>
            <option value="renovation">{t.ptype.renovation}</option>
          </select>
        </div>
        <div>
          <label className="label">{t.newProject.targetWeeks}</label>
          <input name="target_weeks" className="input" type="number" min="1" placeholder={category === "consultancy" ? "6" : "16"} />
        </div>
        <div>
          <label className="label">{t.common.startDate}</label>
          <input name="start_date" className="input" type="date" />
        </div>
        <div>
          <label className="label">{t.common.endDate}</label>
          <input name="end_date" className="input" type="date" />
        </div>
      </div>

      {category === "consultancy" ? (
        <div>
          <label className="label">{t.newProject.fee}</label>
          <input name="consultancy_fee" className="input" type="number" min="0" placeholder="350000" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.newProject.contractValue}</label>
            <input name="contract_value" className="input" type="number" min="0" placeholder="8500000" />
          </div>
          <div>
            <label className="label">{t.newProject.estimatedCost}</label>
            <input name="estimated_cost" className="input" type="number" min="0" placeholder="6800000" />
          </div>
        </div>
      )}

      <div>
        <label className="label">{t.newProject.description}</label>
        <textarea name="description" className="textarea" rows={3} placeholder={t.newProject.descriptionPh} />
      </div>

      {err && <p className="alert-error">{err}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? t.newProject.creating : t.newProject.create}</button>
    </form>
  );
}
