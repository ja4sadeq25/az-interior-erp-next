import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export interface AuditEntry {
  /** Who performed the action (the current session's profile). */
  actor: Pick<Profile, "id" | "name" | "role">;
  /** Dot key translated in the audit UI, e.g. "user.created". */
  action: string;
  /** One of: user | project | purchase_order | invoice | payment | document. */
  entity: string;
  entityId?: string | null;
  /** Human-readable target, e.g. "AZ-C-001 · Dhanmondi Residence". */
  entityLabel?: string | null;
  /** One-line English detail shown under the action, e.g. "status → execution · progress 45%". */
  summary: string;
  /** Extra structured context (never secrets — no passwords, no tokens). */
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit trail write. Uses the service-role client (bypasses RLS —
 * regular users cannot insert into activity_logs by design) and never throws:
 * a missing table (migration not applied yet) or transient error must not
 * break the business action it is recording.
 */
export async function logActivity(e: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("activity_logs").insert({
      actor_id: e.actor.id,
      actor_name: e.actor.name,
      actor_role: e.actor.role,
      action: e.action,
      entity: e.entity,
      entity_id: e.entityId ?? null,
      entity_label: e.entityLabel ?? null,
      summary: e.summary,
      metadata: e.metadata ?? {},
    });
    if (error) console.error("[audit] insert failed:", error.message);
  } catch (err) {
    console.error("[audit] logActivity error:", err);
  }
}
