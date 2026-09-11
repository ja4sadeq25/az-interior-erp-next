import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

/** Current user's profile, or redirect to /login. Optionally restrict to roles (master always passes). */
export async function requireProfile(...roles: Role[]): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !profile.active) redirect("/login?inactive=1");
  if (roles.length && !roles.includes(profile.role) && profile.role !== "master") redirect("/");
  return profile as Profile;
}
