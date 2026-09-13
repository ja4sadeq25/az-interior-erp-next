"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { bdt } from "@/lib/format";

async function canManage() {
  const p = await requireProfile();
  if (!["master", "admin", "architect", "3d_artist", "project_manager"].includes(p.role)) throw new Error("unauthorized");
  return p;
}

export async function createProject(f: {
  title: string; client_name: string; client_email: string; client_phone: string;
  location: string; ptype: string; category: string; start_date: string; end_date: string;
  target_weeks: string; consultancy_fee: string; contract_value: string; estimated_cost: string; description: string;
}) {
  let profile;
  try { profile = await canManage(); } catch (e) { return { error: (e as Error).message }; }
  if (!f.title.trim() || !f.client_name.trim()) return { error: "Title and client name are required." };
  const supabase = await createClient();
  const isExec = f.category === "execution";
  // Architect manages projects but never enters financial fields (money stays masked for the role).
  const money = ["master", "admin", "project_manager", "finance"].includes(profile.role);
  const { data, error } = await supabase.from("projects").insert({
    title: f.title.trim(),
    client_name: f.client_name.trim(),
    client_email: f.client_email || null,
    client_phone: f.client_phone || null,
    location: f.location || null,
    ptype: f.ptype,
    category: f.category,
    status: isExec ? "execution" : "design",
    start_date: f.start_date || null,
    end_date: f.end_date || null,
    target_weeks: f.target_weeks ? Number(f.target_weeks) : null,
    consultancy_fee: !isExec && money && f.consultancy_fee ? Number(f.consultancy_fee) : null,
    contract_value: isExec && money && f.contract_value ? Number(f.contract_value) : null,
    estimated_cost: isExec && money && f.estimated_cost ? Number(f.estimated_cost) : null,
    description: f.description || null,
    created_by: profile.id,
  }).select("id, code").single();
  if (error) return { error: error.message };
  if (isExec && money && f.contract_value) {
    await supabase.rpc("seed_execution_milestones", { pid: data.id, cv: Number(f.contract_value) });
  }
  await logActivity({
    actor: profile, action: "project.created", entity: "project", entityId: data.id,
    entityLabel: `${data.code ?? "—"} · ${f.title.trim()}`,
    summary: `${f.category} project created for ${f.client_name.trim()}`,
    metadata: { category: f.category, ptype: f.ptype },
  });
  revalidatePath("/projects");
  return { ok: true, id: data.id };
}

export async function updateProjectStatus(id: string, status: string, health: string, progress: string) {
  let profile;
  try { profile = await canManage(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { data: p } = await supabase.from("projects").select("code, title").eq("id", id).single();
  const pct = Math.max(0, Math.min(100, Number(progress) || 0));
  const { error } = await supabase.from("projects").update({
    status, health, progress_pct: pct,
  }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity({
    actor: profile, action: "project.status_changed", entity: "project", entityId: id,
    entityLabel: `${p?.code ?? "—"} · ${p?.title ?? id}`,
    summary: `status → ${status} · health → ${health} · progress ${pct}%`,
    metadata: { status, health, progress: pct },
  });
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return { ok: true };
}

export async function updatePhaseStatus(phaseId: string, status: string) {
  try { await canManage(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { error } = await supabase.from("design_phases").update({ status }).eq("id", phaseId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function toggleDeliverable(deliverableId: string, completed: boolean) {
  try { await canManage(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").update({ completed }).eq("id", deliverableId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function approvePhase(phaseId: string, feedback: string) {
  try { await canManage(); } catch (e) { return { error: (e as Error).message }; }
  const supabase = await createClient();
  const { error } = await supabase.from("design_phases").update({
    status: "approved", approved_by_client: true, client_approved_at: new Date().toISOString(),
    client_feedback: feedback || null,
  }).eq("id", phaseId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateMilestoneStatus(id: string, status: string) {
  const p = await requireProfile();
  if (!["master", "admin", "architect", "3d_artist", "project_manager", "finance"].includes(p.role)) return { error: "unauthorized" };
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "completed" || status === "client_approved") patch.completed_date = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("milestones").update(patch).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function convertToExecution(consultancyId: string, contractValue: string, startDate: string, endDate: string) {
  // Conversion sets the contract value — a money decision, so the architect role is excluded.
  const p = await requireProfile();
  if (!["master", "admin", "project_manager"].includes(p.role)) return { error: "unauthorized" };
  const cv = Number(contractValue);
  if (!cv || cv <= 0) return { error: "Enter a valid contract value." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_to_execution", {
    consultancy_id: consultancyId, cv, sd: startDate || null, ed: endDate || null,
  });
  if (error) return { error: error.message };
  const { data: np } = await supabase.from("projects").select("code, title").eq("id", data as string).single();
  await logActivity({
    actor: p, action: "project.converted", entity: "project", entityId: data as string,
    entityLabel: `${np?.code ?? "—"} · ${np?.title ?? ""}`,
    summary: `consultancy converted to turnkey execution · contract value ${bdt(cv)}`,
    metadata: { contract_value: cv },
  });
  revalidatePath("/projects");
  return { ok: true, id: data as string };
}
