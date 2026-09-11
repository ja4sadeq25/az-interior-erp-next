"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertMaster() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  const { data: p } = await supabase.from("profiles").select("role, active").eq("id", user.id).single();
  if (!p || p.role !== "master" || !p.active) throw new Error("Master Account only.");
}

export async function createUser(f: {
  name: string; email: string; password: string; role: string; phone: string; title: string; department: string; client_project_id: string;
}) {
  try { await assertMaster(); } catch (e) { return { error: (e as Error).message }; }
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
  revalidatePath("/users");
  return { ok: true };
}

export async function updateUser(id: string, f: { name?: string; role?: string; active?: boolean; phone?: string | null; title?: string | null; client_project_id?: string | null }) {
  try { await assertMaster(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(f).eq("id", id);
  if (error) return { error: error.message };
  if (f.active === false) {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(id).catch(() => null);
  }
  revalidatePath("/users");
  return { ok: true };
}

export async function resetPassword(id: string, password: string) {
  try { await assertMaster(); } catch (e) { return { error: (e as Error).message }; }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { ok: true };
}
