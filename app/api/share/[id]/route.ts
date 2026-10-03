import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ session: null, available: false });
    const res = await fetch(`${url}/rest/v1/sessions?id=eq.${id}&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("err");
    const rows = await res.json();
    return NextResponse.json({ session: rows[0] ?? null, available: true });
  } catch {
    return NextResponse.json({ session: null, available: false });
  }
}
