import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrackFile = { path: string };

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

  // The 'photos' bucket is private — hand the client short-lived signed URLs only.
  const paths = new Set<string>();
  for (const g of (data.gallery ?? []) as TrackFile[]) if (g.path) paths.add(g.path);
  for (const ph of data.phases ?? [])
    for (const d of ph.deliverables ?? [])
      for (const f of (d.files ?? []) as TrackFile[]) if (f.path) paths.add(f.path);

  const urls: Record<string, string> = {};
  const list = [...paths];
  if (list.length) {
    const { data: signed } = await admin.storage.from("photos").createSignedUrls(list, 3600);
    signed?.forEach((s, i) => { if (s.signedUrl) urls[list[i]] = s.signedUrl; });
  }

  return NextResponse.json({ ...data, urls });
}
