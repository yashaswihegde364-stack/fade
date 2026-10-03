"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessions, getStreak } from "@/lib/storage";
import { SessionResult } from "@/lib/types";

function MiniCurve({ session }: { session: SessionResult }) {
  const w = 120;
  const h = 48;
  const pts = session.curve.length > 1 ? session.curve : [{ t: 0, s: session.startLevel }];
  const maxT = pts[pts.length - 1]?.t || 1;
  const path = pts
    .map((p, i) => {
      const x = (p.t / maxT) * w;
      const y = h - (p.s / 100) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default function History() {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setSessions(getSessions().filter((s) => !s.isDemo));
    setStreak(getStreak());
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">History</h1>
        <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm">
          {streak} day streak
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">No sessions yet. Start one to see it here.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/results?id=${s.id}`}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]"
            >
              <p className="truncate text-sm font-medium">{s.task}</p>
              <div className="mt-2">
                <MiniCurve session={s} />
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {new Date(s.createdAt).toLocaleDateString()} · {s.deepestZone}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
