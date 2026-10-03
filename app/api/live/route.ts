import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ ok: true, stored: false });
    const body = await request.json();
    await fetch(`${url}/rest/v1/live_sessions?on_conflict=device_id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify([
        { device_id: body.device_id, zone: body.zone, updated_at: new Date().toISOString() },
      ]),
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json({ total: 0, byZone: {}, available: false });
    }
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const res = await fetch(`${url}/rest/v1/live_sessions?select=zone&updated_at=gte.${since}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("err");
    const rows = await res.json();
    const byZone: Record<string, number> = {};
    for (const r of rows) byZone[r.zone] = (byZone[r.zone] || 0) + 1;
    return NextResponse.json({ total: rows.length, byZone, available: true });
  } catch {
    return NextResponse.json({ total: 0, byZone: {}, available: false });
  }
}
