"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";

async function canLog() {
  const p = await requireProfile();
  if (!["master", "admin", "project_manager", "site_engineer"].includes(p.role)) throw new Error("unauthorized");
  return p;
}

export async function addDailyLog(f: {
  project_id: string; log_date: string; weather: string; work_completed: string; challenges: string;
  materials_received: string; inspected_by: string;
  carpenters: string; masons: string; electricians: string; painters: string; plumbers: string; helpers: string;
}) {
  let profile;
  try { profile = await canLog(); } catch (e) { return { error: (e as Error).message }; }
  if (!f.project_id) return { error: "Select a project." };
  if (!f.work_completed.trim()) return { error: "Describe the work completed." };
  const supabase = await createClient();
  const { error } = await supabase.from("daily_logs").insert({
    project_id: f.project_id,
    log_date: f.log_date || new Date().toISOString().slice(0, 10),
    engineer_name: profile.name,
    weather: f.weather || "Sunny & Clear",
    work_completed: f.work_completed.trim(),
    challenges: f.challenges || null,
    materials_received: f.materials_received || null,
    inspected_by: f.inspected_by || null,
    workers: {
      carpenters: Number(f.carpenters) || 0,
      masons: Number(f.masons) || 0,
      electricians: Number(f.electricians) || 0,
      painters: Number(f.painters) || 0,
      plumbers: Number(f.plumbers) || 0,
      helpers: Number(f.helpers) || 0,
    },
  });
  if (error) return { error: error.message };
  revalidatePath("/site");
  return { ok: true };
}

export async function addSnag(f: { project_id: string; space_name: string; description: string; priority: string; assigned_to: string }) {
  try { await canLog(); } catch (e) { return { error: (e as Error).message }; }
  if (!f.project_id) return { error: "Select a project." };
  if (!f.description.trim()) return { error: "Describe the snag." };
  const supabase = await createClient();
  const { error } = await supabase.from("snags").insert({
    project_id: f.project_id,
    space_name: f.space_name || null,
    description: f.description.trim(),
    priority: f.priority || "medium",
    assigned_to: f.assigned_to || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/site");
  return { ok: true };
}

export async function updateSnagStatus(id: string, status: string) {
  try { await canLog(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "resolved") patch.resolved_date = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("snags").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/site");
  return { ok: true };
}
