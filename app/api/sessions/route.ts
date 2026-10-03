import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ ok: true, stored: false });
    const body = await request.json();
    const row = {
      id: body.id,
      device_id: body.deviceId,
      task: body.task,
      first_step: body.firstStep,
      planned_minutes: body.plannedMinutes,
      actual_seconds: Math.round(body.actualSeconds),
      start_level: body.startLevel,
      deepest_zone: body.deepestZone,
      quiet_seconds: Math.round(body.quietSeconds),
      drifts: body.drifts,
      checkins_answered: body.checkinsAnswered,
      checkins_missed: body.checkinsMissed,
      curve: body.curve,
      drift_points: body.driftPoints,
      is_demo: body.isDemo,
      created_at: body.createdAt,
    };
    const res = await fetch(`${url}/rest/v1/sessions`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    return NextResponse.json({ ok: true, stored: res.ok });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const deviceId = request.nextUrl.searchParams.get("device_id");
    if (!url || !key || !deviceId) return NextResponse.json({ sessions: [], available: false });
    const res = await fetch(
      `${url}/rest/v1/sessions?device_id=eq.${deviceId}&order=created_at.desc&limit=100`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (!res.ok) throw new Error("err");
    const sessions = await res.json();
    return NextResponse.json({ sessions, available: true });
  } catch {
    return NextResponse.json({ sessions: [], available: false });
  }
}
