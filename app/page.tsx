"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ParticleField from "@/components/ParticleField";
import ThemeToggle from "@/components/ThemeToggle";
import { getAnimSetting } from "@/lib/storage";

export default function Landing() {
  const [live, setLive] = useState<{ total: number; byZone: Record<string, number> } | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/live")
      .then((r) => r.json())
      .then((d) => setLive(d))
      .catch(() => {});
  }, []);

  const anim = typeof window !== "undefined" ? getAnimSetting() : "full";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {anim !== "off" && <div className="aurora-layer" />}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <ParticleField S={100} anim={anim} loop />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, transparent, var(--bg) 85%), linear-gradient(to bottom, transparent, var(--bg) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="font-display text-lg font-semibold tracking-tight">fade</span>
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="hidden cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--fg)] sm:block"
            >
              History
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl font-semibold tracking-tight sm:text-7xl"
          >
            fade
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-[var(--muted)] sm:text-xl"
          >
            Starts loud. Gets quiet. You keep going.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/setup"
              className="cursor-pointer rounded-full bg-[var(--accent)] px-8 py-3.5 font-medium text-[#1a1206] transition hover:brightness-110 active:scale-95"
            >
              Start a session
            </Link>
            <Link
              href="/session?demo=1"
              className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--card)] px-8 py-3.5 font-medium transition hover:border-[var(--accent)] active:scale-95"
            >
              Try the 90-second demo
            </Link>
          </motion.div>

          {live && live.total > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-sm text-[var(--muted)]"
            >
              {live.total} {live.total === 1 ? "person" : "people"} fading right now
              {Object.keys(live.byZone).length > 0 && (
                <span>
                  {" "}
                  · {Object.entries(live.byZone)
                    .map(([z, n]) => `${n} ${z}`)
                    .join(", ")}
                </span>
              )}
            </motion.p>
          )}
        </section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mb-10 max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-5 text-left text-sm text-[var(--muted)] backdrop-blur"
        >
          <p className="mb-1 font-medium text-[var(--fg)]">A note from the founder</p>
          <p>
            I have ADHD. Every focus app I tried either bored me or became another thing to
            scroll. Fade gives my brain the stimulation it wants at the start, then slowly takes
            it away.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
