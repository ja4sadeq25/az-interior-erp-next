"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/actions/users";
import { useT } from "@/components/providers";

export default function UserForm({ projects }: { projects: { id: string; code: string; title: string }[] }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("project_manager");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setErr(null); setOk(false);
    start(async () => {
      const res = await createUser(Object.fromEntries(fd) as never);
      if (res.error) setErr(res.error);
      else { setOk(true); setOpen(false); router.refresh(); }
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button className="btn" onClick={() => setOpen(true)}>{t.users.addUser}</button>
        {ok && <span className="text-sm text-emerald-700 dark:text-emerald-400">{t.users.userCreated}</span>}
      </div>
    );
  }

  return (
    <form action={submit} className="card space-y-3 p-5">
      <h3 className="font-semibold">{t.users.createTitle}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">{t.users.nameReq}</label><input name="name" className="input" required /></div>
        <div><label className="label">{t.users.emailReq}</label><input name="email" className="input" type="email" required /></div>
        <div><label className="label">{t.users.tempPw}</label><input name="password" className="input" required minLength={8} /></div>
        <div>
          <label className="label">{t.users.roleReq}</label>
          <select name="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">{t.roles.admin}</option>
            <option value="architect">{t.roles.architect}</option>
            <option value="3d_artist">{t.roles["3d_artist"]}</option>
            <option value="project_manager">{t.roles.project_manager}</option>
            <option value="site_engineer">{t.roles.site_engineer}</option>
            <option value="procurement">{t.roles.procurement}</option>
            <option value="finance">{t.roles.finance}</option>
            <option value="client">{t.roles.client}</option>
          </select>
        </div>
        <div><label className="label">{t.common.phone}</label><input name="phone" className="input" /></div>
        <div><label className="label">{t.users.title}</label><input name="title" className="input" placeholder={t.users.titlePh} /></div>
        <div><label className="label">{t.users.department}</label><input name="department" className="input" /></div>
        {role === "client" && (
          <div className="sm:col-span-2">
            <label className="label">{t.users.boundProject}</label>
            <select name="client_project_id" className="input">
              <option value="">{t.common.selectProject}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
            </select>
          </div>
        )}
      </div>
      {err && <p className="alert-error">{err}</p>}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{pending ? t.users.creating : t.users.createUser}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
