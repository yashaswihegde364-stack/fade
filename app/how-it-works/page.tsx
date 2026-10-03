"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const STEPS = [
  {
    step: "1",
    title: "Say what you're avoiding",
    body: "And the smallest first step. Nothing fancy, just enough to begin.",
  },
  {
    step: "2",
    title: "It starts loud",
    body: "Motion, sound, frequent check-ins. Stimulation to get you moving.",
  },
  {
    step: "3",
    title: "It quietly fades",
    body: "As you stay with it, the noise drops away on its own.",
  },
  {
    step: "4",
    title: "Drift? No guilt",
    body: 'Tap "I drifted." It turns back up a little and keeps going.',
  },
];

export default function HowItWorks() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <h1 className="font-display text-2xl font-semibold">How it works</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Built for ADHD brains that need stimulation to start, and less of it to keep going.
      </p>

      <div className="mt-8 space-y-3">
        {STEPS.map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <span className="font-display text-xs text-[var(--accent)]">{item.step}</span>
            <p className="mt-1.5 text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
        <p>
          You can also skip setup entirely and just{" "}
          <Link href="/talk" className="text-[var(--accent)] underline-offset-2 hover:underline">
            talk to it
          </Link>
          . Everything you capture mid-session lands in your{" "}
          <Link href="/inbox" className="text-[var(--accent)] underline-offset-2 hover:underline">
            brain dump
          </Link>
          , and every session you finish counts toward{" "}
          <Link
            href="/achievements"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            achievements
          </Link>
          .
        </p>
      </div>

      <Link
        href="/setup"
        className="mt-8 flex w-full cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] py-3.5 font-medium text-[#1a1206] transition hover:brightness-110"
      >
        Start a session
      </Link>
    </main>
  );
}
