"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUser, resetPassword } from "@/app/actions/users";
import type { Profile } from "@/lib/types";

export default function UserRow({ user, isSelf, roleLabel, joined, projects }: {
  user: Profile; isSelf: boolean; roleLabel: string; joined: string;
  projects: { id: string; code: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState("");

  function changeRole(role: string) {
    start(async () => {
      const res = await updateUser(user.id, { role });
      setMsg(res.error ?? "Role updated");
      router.refresh();
    });
  }
  function toggleActive() {
    start(async () => {
      const res = await updateUser(user.id, { active: !user.active });
      setMsg(res.error ?? (user.active ? "Deactivated" : "Activated"));
      router.refresh();
    });
  }
  function doReset() {
    if (!pw) return;
    start(async () => {
      const res = await resetPassword(user.id, pw);
      setMsg(res.error ?? "Password reset ✓");
      if (!res.error) setPw("");
    });
  }

  return (
    <tr>
      <td className="td">
        <p className="font-semibold">{user.name}{isSelf && <span className="ml-1 text-xs text-neutral-400">(you)</span>}</p>
        <p className="text-xs text-neutral-400">{user.title ?? user.department ?? "—"}</p>
      </td>
      <td className="td">
        {user.role === "master" || isSelf ? (
          <span className="badge border-neutral-900 bg-neutral-950 text-white">{roleLabel}</span>
        ) : (
          <select className="select py-1.5 text-xs" value={user.role} disabled={pending} onChange={(e) => changeRole(e.target.value)}>
            {["admin", "project_manager", "site_engineer", "procurement", "finance", "client"].map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>
        )}
        {user.role === "client" && user.client_project_id && (
          <p className="mt-1 text-[10px] text-neutral-400">
            bound: {projects.find((p) => p.id === user.client_project_id)?.code ?? "?"}
          </p>
        )}
      </td>
      <td className="td text-xs">{user.email}<br />{user.phone ?? ""}</td>
      <td className="td text-xs">{joined}</td>
      <td className="td">
        <span className={`badge ${user.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {user.active ? "Active" : "Deactivated"}
        </span>
      </td>
      <td className="td">
        {!isSelf && user.role !== "master" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button className="btn-ghost px-2 py-1 text-[11px]" onClick={toggleActive} disabled={pending}>
              {user.active ? "Deactivate" : "Activate"}
            </button>
            <input className="input w-28 px-2 py-1 text-xs" type="text" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn px-2 py-1 text-[11px]" onClick={doReset} disabled={pending || !pw}>Reset PW</button>
            {msg && <span className="w-full text-[10px] text-neutral-500">{msg}</span>}
          </div>
        )}
      </td>
    </tr>
  );
}
