import { createClient as createSbClient } from "@supabase/supabase-js";

/** Service-role client. Server only. Bypasses RLS — use sparingly (user management). */
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
