import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import type { Profile } from "@/lib/types";
import UserForm from "./user-form";
import UserRow from "./user-row";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  master: "Master Account",
  admin: "Admin",
  project_manager: "Project Manager",
  site_engineer: "Site Engineer",
  procurement: "Procurement",
  finance: "Finance & Accounts",
  client: "Client Portal",
};

export default async function UsersPage() {
  const me = await requireProfile();
  if (me.role !== "master") redirect("/");
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
        <p className="mono text-neutral-400">Master Account</p>
        <h1 className="text-2xl font-bold tracking-tight">Team & User Security</h1>
        <p className="text-sm text-neutral-500">
          Staff accounts are created here — there is no self sign-up. First user is always the Master.
        </p>
      </header>

      <UserForm projects={projectList} />

      <div className="table-wrap">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="th">User</th>
              <th className="th">Role</th>
              <th className="th">Contact</th>
              <th className="th">Joined</th>
              <th className="th">Status</th>
              <th className="th">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {list.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === me.id} projects={projectList} roleLabel={ROLE_LABEL[u.role] ?? u.role} joined={fmtDate(u.created_at)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
