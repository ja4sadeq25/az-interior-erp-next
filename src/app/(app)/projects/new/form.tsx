"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";

export default function ProjectForm() {
  const router = useRouter();
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
        <label className="label">Project Category *</label>
        <div className="grid grid-cols-2 gap-2">
          {(["consultancy", "execution"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                category === c ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {c === "consultancy" ? "Consultancy · Design (4–6 weeks)" : "Execution · Turnkey (12–24 weeks)"}
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="category" value={category} />

      <div>
        <label className="label">Project Title *</label>
        <input name="title" className="input" required placeholder="e.g. Gulshan Lakeview Penthouse Interior" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Client Name *</label>
          <input name="client_name" className="input" required />
        </div>
        <div>
          <label className="label">Client Phone</label>
          <input name="client_phone" className="input" placeholder="+880 1XXX-XXXXXX" />
        </div>
        <div>
          <label className="label">Client Email</label>
          <input name="client_email" className="input" type="email" />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" className="input" placeholder="Gulshan 2, Dhaka" />
        </div>
        <div>
          <label className="label">Project Type</label>
          <select name="ptype" className="input" defaultValue="residential">
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="hospitality">Hospitality</option>
            <option value="renovation">Renovation</option>
          </select>
        </div>
        <div>
          <label className="label">Target Weeks</label>
          <input name="target_weeks" className="input" type="number" min="1" placeholder={category === "consultancy" ? "6" : "16"} />
        </div>
        <div>
          <label className="label">Start Date</label>
          <input name="start_date" className="input" type="date" />
        </div>
        <div>
          <label className="label">End Date</label>
          <input name="end_date" className="input" type="date" />
        </div>
      </div>

      {category === "consultancy" ? (
        <div>
          <label className="label">Consultancy Design Fee (৳)</label>
          <input name="consultancy_fee" className="input" type="number" min="0" placeholder="350000" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Contract Value (৳)</label>
            <input name="contract_value" className="input" type="number" min="0" placeholder="8500000" />
          </div>
          <div>
            <label className="label">Estimated Cost (৳)</label>
            <input name="estimated_cost" className="input" type="number" min="0" placeholder="6800000" />
          </div>
        </div>
      )}

      <div>
        <label className="label">Description</label>
        <textarea name="description" className="textarea" rows={3} placeholder="Scope summary…" />
      </div>

      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Creating…" : "Create Project"}</button>
    </form>
  );
}
