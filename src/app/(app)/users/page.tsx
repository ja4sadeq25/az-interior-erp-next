import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { fmtDate } from "@/lib/format";
import type { Profile } from "@/lib/types";
import UserForm from "./user-form";
import UserRow from "./user-row";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireProfile();
  if (me.role !== "master") redirect("/");
  const t = await getDict();
  const supabase = await createClient();
  const [{ data: users }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("projects").select("id, code, title").order("created_at", { ascending: false }),
  ]);
  const list = (users ?? []) as Profile[];
  const projectList = (projects ?? []) as { id: string; code: string; title: string }[];

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-neutral-400 dark:text-neutral-500">{t.users.kicker}</p>
        <h1 className="text-2xl font-bold tracking-tight">{t.users.heading}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t.users.desc}
        </p>
      </header>

      <UserForm projects={projectList} />

      <div className="table-wrap">
        <table className="w-full min-w-[820px]">
          <thead className="table-head">
            <tr>
              <th className="th">{t.users.thUser}</th>
              <th className="th">{t.users.thRole}</th>
              <th className="th">{t.users.thContact}</th>
              <th className="th">{t.users.thJoined}</th>
              <th className="th">{t.users.thStatus}</th>
              <th className="th">{t.users.thControls}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {list.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === me.id} projects={projectList} roleLabel={t.roles[u.role] ?? u.role} joined={fmtDate(u.created_at)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
