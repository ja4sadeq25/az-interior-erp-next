import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { code, phone } = await req.json().catch(() => ({}));
  if (!code || !phone) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("track_project", {
    p_code: String(code),
    p_phone: String(phone),
    p_ip: ip,
  });

  if (error) {
    const many = error.message.includes("too_many");
    return NextResponse.json({ error: many ? "too_many_attempts" : "error" }, { status: many ? 429 : 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}
