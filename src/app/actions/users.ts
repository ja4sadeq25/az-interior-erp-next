"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/audit";
import type { Role } from "@/lib/types";

async function assertMaster(): Promise<{ id: string; name: string; role: Role }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  const { data: p } = await supabase.from("profiles").select("id, name, role, active").eq("id", user.id).single();
  if (!p || p.role !== "master" || !p.active) throw new Error("Master Account only.");
  return p as { id: string; name: string; role: Role };
}

export async function createUser(f: {
  name: string; email: string; password: string; role: string; phone: string; title: string; department: string; client_project_id: string;
}) {
  let master;
  try { master = await assertMaster(); } catch (e) { return { error: (e as Error).message }; }
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: f.email, password: f.password, email_confirm: true, user_metadata: { name: f.name },
  });
  if (error) return { error: error.message };
  const { error: pErr } = await admin.from("profiles").update({
    name: f.name, role: f.role, phone: f.phone || null, title: f.title || null,
    department: f.department || null, client_project_id: f.client_project_id || null,
  }).eq("id", data.user.id);
  if (pErr) return { error: pErr.message };
  await logActivity({
    actor: master, action: "user.created", entity: "user", entityId: data.user.id,
    entityLabel: `${f.name} (${f.email})`,
    summary: `staff account created with role ${f.role}`,
    metadata: { role: f.role, title: f.title || null, department: f.department || null },
  });
  revalidatePath("/users");
  return { ok: true };
}

export async function updateUser(id: string, f: { name?: string; role?: string; active?: boolean; phone?: string | null; title?: string | null; client_project_id?: string | null }) {
  let master;
  try { master = await assertMaster(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("name, email").eq("id", id).single();
  const { error } = await supabase.from("profiles").update(f).eq("id", id);
  if (error) return { error: error.message };
  if (f.active === false) {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(id).catch(() => null);
  }
  const changes: string[] = [];
  if (f.role !== undefined) changes.push(`role → ${f.role}`);
  if (f.active !== undefined) changes.push(f.active ? "activated" : "deactivated");
  if (f.name !== undefined) changes.push("name updated");
  if (f.phone !== undefined) changes.push("phone updated");
  if (f.title !== undefined) changes.push("title updated");
  if (f.client_project_id !== undefined) changes.push("bound project updated");
  await logActivity({
    actor: master, action: "user.updated", entity: "user", entityId: id,
    entityLabel: target ? `${target.name}${target.email ? ` (${target.email})` : ""}` : id,
    summary: changes.join(" · ") || "profile updated",
    metadata: { changes: f },
  });
  revalidatePath("/users");
  return { ok: true };
}

export async function resetPassword(id: string, password: string) {
  let master;
  try { master = await assertMaster(); } catch (e) { return { error: (e as Error).message }; }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  const { data: target } = await admin.from("profiles").select("name").eq("id", id).single();
  await logActivity({
    actor: master, action: "user.password_reset", entity: "user", entityId: id,
    entityLabel: target?.name ?? id,
    summary: "password reset by Master (new password not recorded)",
  });
  return { ok: true };
}
