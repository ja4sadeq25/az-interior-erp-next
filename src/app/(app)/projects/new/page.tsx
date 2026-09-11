import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import ProjectForm from "./form";

export default async function NewProjectPage() {
  const profile = await requireProfile();
  if (!["master", "admin", "project_manager"].includes(profile.role)) redirect("/projects");
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="mono text-neutral-400">Portfolio</p>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
        <p className="text-sm text-neutral-500">
          Consultancy projects get the standard 4-phase design roadmap automatically. Execution projects get the
          5-milestone billing schedule (20/25/25/20/10%).
        </p>
      </header>
      <ProjectForm />
    </div>
  );
}
