"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { getSessionById } from "@/lib/storage";
import { SessionResult, ZONE_LABEL } from "@/lib/types";

function Curve({ session }: { session: SessionResult }) {
  const w = 600;
  const h = 200;
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
      <motion.path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      {session.driftPoints.map((d, i) => (
        <motion.circle
          key={i}
          cx={(d.t / maxT) * w}
          cy={h - (d.s / 100) * h}
          r={4}
          fill="var(--accent2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        />
      ))}
    </svg>
  );
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function ResultsInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [session, setSession] = useState<SessionResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) setSession(getSessionById(id));
  }, [id]);

  async function share() {
    if (!session) return;
    const url = `${window.location.origin}/r/${session.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link", url);
    }
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-[var(--muted)]">
        Loading your results...
      </main>
    );
  }

  const nextStart = session.deepestZone === "quiet" || session.deepestZone === "silent"
    ? Math.max(50, session.startLevel - 8)
    : session.startLevel;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-[var(--muted)]">{session.isDemo ? "Demo complete" : "Session complete"}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">{session.task}</h1>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Curve session={session} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Deepest zone", value: ZONE_LABEL[session.deepestZone] },
            { label: "Minutes quiet+", value: <Counter value={Math.round(session.quietSeconds / 60)} suffix="m" /> },
            { label: "Drifts", value: <Counter value={session.drifts} /> },
            { label: "Check-ins answered", value: <Counter value={session.checkinsAnswered} /> },
            {
              label: "Steps completed",
              value: `${session.steps?.filter((s) => s.done).length ?? 0}/${session.steps?.length ?? 0}`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="font-display text-2xl font-semibold">{stat.value}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>

        {!session.isDemo && (
          <p className="mt-6 text-sm text-[var(--muted)]">
            Next session starts at {nextStart} instead of {session.startLevel}.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={share}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-medium hover:border-[var(--accent)]"
          >
            {copied ? <Check size={15} /> : <Share2 size={15} />}
            {copied ? "Link copied" : "Share this session"}
          </button>
          <Link
            href="/setup"
            className="flex cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[#1a1206]"
          >
            Start another
          </Link>
          <Link
            href="/history"
            className="flex cursor-pointer items-center justify-center rounded-full px-6 py-3 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
          >
            View history
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function Results() {
  return (
    <Suspense fallback={null}>
      <ResultsInner />
    </Suspense>
  );
}
