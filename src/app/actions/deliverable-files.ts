"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";
import { logActivity } from "@/lib/audit";

const UPLOADERS = ["master", "admin", "architect", "project_manager", "site_engineer"];
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

/** Upload one proof file against a deliverable. Stored private; shown to the client only when marked. */
export async function uploadDeliverableFile(f: {
  project_id: string; phase_id: string; deliverable_id: string;
  caption: string; client_visible: boolean; file: File;
}) {
  const profile = await requireProfile();
  if (!UPLOADERS.includes(profile.role)) return { error: "unauthorized" };
  if (!f.file || f.file.size === 0) return { error: "Choose a file to upload." };
  if (f.file.size > MAX_BYTES) return { error: "File is larger than 15 MB." };
  if (f.file.type && !ALLOWED.includes(f.file.type)) return { error: "Only images and PDF files are allowed." };

  const supabase = await createClient();
  const safe = f.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${f.project_id}/${crypto.randomUUID()}-${safe}`;
  const { error: upErr } = await supabase.storage.from("photos").upload(path, f.file, { contentType: f.file.type });
  if (upErr) return { error: upErr.message };

  const { data, error } = await supabase.from("deliverable_files").insert({
    project_id: f.project_id,
    phase_id: f.phase_id || null,
    deliverable_id: f.deliverable_id || null,
    storage_path: path,
    file_name: f.file.name,
    mime: f.file.type || null,
    size_bytes: f.file.size,
    caption: f.caption?.trim() || null,
    client_visible: !!f.client_visible,
    uploaded_by: profile.id,
  }).select("id").single();
  if (error) return { error: error.message };

  await logActivity({
    actor: profile, action: "deliverable.file_uploaded", entity: "project", entityId: f.project_id,
    entityLabel: f.file.name,
    summary: `${f.client_visible ? "client-visible" : "internal"} · ${Math.ceil(f.file.size / 1024)} KB`,
    metadata: { deliverable_id: f.deliverable_id, file_id: data.id, client_visible: !!f.client_visible },
  });
  revalidatePath(`/projects/${f.project_id}`);
  return { ok: true };
}

export async function setFileVisibility(id: string, projectId: string, visible: boolean) {
  const profile = await requireProfile();
  if (!UPLOADERS.includes(profile.role)) return { error: "unauthorized" };
  const supabase = await createClient();
  const { data: row } = await supabase.from("deliverable_files").select("file_name").eq("id", id).single();
  const { error } = await supabase.from("deliverable_files").update({ client_visible: visible }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity({
    actor: profile, action: "deliverable.file_visibility", entity: "project", entityId: projectId,
    entityLabel: row?.file_name ?? id,
    summary: visible ? "shown to client" : "hidden from client",
    metadata: { file_id: id, client_visible: visible },
  });
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function deleteDeliverableFile(id: string, projectId: string) {
  const profile = await requireProfile();
  if (!["master", "admin"].includes(profile.role)) return { error: "Only Master or Admin can delete a file." };
  const supabase = await createClient();
  const { data: row } = await supabase.from("deliverable_files").select("storage_path, file_name").eq("id", id).single();
  if (!row) return { error: "not found" };
  await supabase.storage.from("photos").remove([row.storage_path]);
  const { error } = await supabase.from("deliverable_files").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity({
    actor: profile, action: "deliverable.file_deleted", entity: "project", entityId: projectId,
    entityLabel: row.file_name, summary: "file removed", metadata: { file_id: id },
  });
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
