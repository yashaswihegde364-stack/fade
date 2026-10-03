"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import { getSessions, getStreak, getBestStreak, getWeeklyStats, WeeklyStats } from "@/lib/storage";
import { SessionResult } from "@/lib/types";

function TrendChart({ sessions }: { sessions: SessionResult[] }) {
  const chronological = [...sessions].reverse();
  const w = 600;
  const h = 100;
  const n = chronological.length;
  const barW = Math.min(28, w / Math.max(n, 1) - 6);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-xs text-[var(--muted)]">Starting level over time</p>
      <svg viewBox={`0 0 ${w} ${h + 16}`} className="mt-3 w-full overflow-visible">
        {chronological.map((s, i) => {
          const x = n <= 1 ? w / 2 - barW / 2 : (i / (n - 1)) * (w - barW);
          const barH = (s.startLevel / 100) * h;
          return (
            <motion.rect
              key={s.id}
              x={x}
              y={h - barH}
              width={barW}
              rx={4}
              fill="var(--accent)"
              initial={{ height: 0, y: h }}
              animate={{ height: barH, y: h - barH }}
              transition={{ delay: i * 0.03, duration: 0.5, ease: "easeOut" }}
            />
          );
        })}
      </svg>
    </div>
  );
}

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
  const [bestStreak, setBestStreak] = useState(0);
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    setSessions(getSessions().filter((s) => !s.isDemo));
    setStreak(getStreak());
    setBestStreak(getBestStreak());
    setWeekly(getWeeklyStats());
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold">History</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/achievements"
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm transition hover:border-[var(--accent)]"
          >
            <Trophy size={14} />
            <span className="hidden sm:inline">Achievements</span>
          </Link>
          <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm">
            {streak} day streak
          </div>
        </div>
      </div>

      {weekly && sessions.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "This week", value: weekly.sessionsThisWeek, suffix: " sessions" },
            { label: "Minutes this week", value: weekly.minutesThisWeek, suffix: "m" },
            { label: "Best streak", value: bestStreak, suffix: "d" },
            { label: "All-time minutes", value: weekly.totalMinutes, suffix: "m" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="font-display text-xl font-semibold">
                {s.value}
                <span className="text-sm text-[var(--muted)]">{s.suffix}</span>
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">No sessions yet. Start one to see it here.</p>
      ) : (
        <>
          {sessions.length > 1 && (
            <div className="mt-8">
              <TrendChart sessions={sessions} />
            </div>
          )}
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
        </>
      )}
    </main>
  );
}
