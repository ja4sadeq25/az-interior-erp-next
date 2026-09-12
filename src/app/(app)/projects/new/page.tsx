import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import ProjectForm from "./form";

export default async function NewProjectPage() {
  const profile = await requireProfile();
  if (!["master", "admin", "architect", "project_manager"].includes(profile.role)) redirect("/projects");
  const t = await getDict();
  const canEnterMoney = ["master", "admin", "project_manager"].includes(profile.role);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="mono text-neutral-400 dark:text-neutral-500">{t.newProject.kicker}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.newProject.heading}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t.newProject.desc}
        </p>
      </header>
      <ProjectForm canEnterMoney={canEnterMoney} />
    </div>
  );
}
