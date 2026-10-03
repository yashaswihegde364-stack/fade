import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json({ sessionsToday: 0, quietMinutesTotal: 0, available: false });
    }
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const res = await fetch(
      `${url}/rest/v1/sessions?select=quiet_seconds&is_demo=eq.false&created_at=gte.${since.toISOString()}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (!res.ok) throw new Error("supabase error");
    const rows = await res.json();
    const sessionsToday = rows.length;
    const quietMinutesTotal = Math.round(
      rows.reduce((sum: number, r: any) => sum + (r.quiet_seconds || 0), 0) / 60,
    );
    return NextResponse.json({ sessionsToday, quietMinutesTotal, available: true });
  } catch {
    return NextResponse.json({ sessionsToday: 0, quietMinutesTotal: 0, available: false });
  }
}
