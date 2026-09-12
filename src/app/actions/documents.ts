"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/session";

async function canUpload() {
  const p = await requireProfile();
  if (!["master", "admin", "project_manager", "site_engineer"].includes(p.role)) throw new Error("unauthorized");
  return p;
}

export async function uploadDocument(f: {
  title: string; project_id: string; category: string; version: string; description: string; file: File;
}) {
  let profile;
  try { profile = await canUpload(); } catch (e) { return { error: (e as Error).message }; }
  if (!f.title.trim()) return { error: "Title is required." };
  if (!f.file || f.file.size === 0) return { error: "Choose a file to upload." };
  const ext = f.file.name.split(".").pop()?.toUpperCase() ?? "PDF";
  const supabase = await createClient();
  const path = `${crypto.randomUUID()}-${f.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { error: upErr } = await supabase.storage.from("documents").upload(path, f.file, { contentType: f.file.type });
  if (upErr) return { error: upErr.message };
  const { error } = await supabase.from("documents").insert({
    title: f.title.trim(),
    project_id: f.project_id || null,
    category: f.category || "blueprint",
    file_type: ext,
    file_size: f.file.size > 1e6 ? `${(f.file.size / 1e6).toFixed(1)} MB` : `${Math.ceil(f.file.size / 1024)} KB`,
    version: f.version || "v1.0",
    uploaded_by: profile.id,
    description: f.description || null,
    file_path: path,
  });
  if (error) return { error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}

export async function updateDocStatus(id: string, status: string) {
  const p = await requireProfile();
  if (!["master", "admin", "architect", "project_manager"].includes(p.role)) return { error: "unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("documents").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/documents");
  return { ok: true };
}
