"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const BREAK_SECONDS = 180;

function BreakInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/results";
  const [remaining, setRemaining] = useState(BREAK_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          router.push(next);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-[var(--muted)]">Take a breath before you go</p>

      <div className="relative mt-10 flex h-56 w-56 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%)",
          }}
          animate={{ scale: [0.72, 1, 1, 0.72], opacity: [0.5, 0.9, 0.9, 0.5] }}
          transition={{ duration: 10, times: [0, 0.4, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="h-28 w-28 rounded-full border border-[var(--border)] bg-[var(--card)]"
          animate={{ scale: [0.72, 1, 1, 0.72] }}
          transition={{ duration: 10, times: [0, 0.4, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.p
        key={Math.floor(remaining / 10) % 2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-10 text-sm text-[var(--muted)]"
      >
        Breathe in, breathe out
      </motion.p>

      <p className="mt-2 font-display text-lg tabular-nums text-[var(--muted)]">
        {mm}:{String(ss).padStart(2, "0")}
      </p>

      <button
        onClick={() => router.push(next)}
        className="mt-10 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-2.5 text-sm transition hover:border-[var(--accent)]"
      >
        Skip break
      </button>
    </main>
  );
}

export default function Break() {
  return (
    <Suspense fallback={null}>
      <BreakInner />
    </Suspense>
  );
}
