"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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

export default function WelcomeNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("fade_onboarding_seen_v2")) return;
    const t = setTimeout(() => setShow(true), 2800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("fade_onboarding_seen_v2", "1");
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl"
          >
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute right-4 top-4 cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]"
            >
              <X size={16} />
            </button>

            <p className="pr-6 text-sm text-[var(--fg)]">
              I have ADHD. This app is for people like us, who can do anything, when the moment is
              right.
            </p>

            <p className="mb-3 mt-5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              How it works
            </p>
            <div className="space-y-2.5">
              {STEPS.map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5"
                >
                  <span className="font-display text-xs text-[var(--accent)]">{item.step}</span>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-[var(--muted)]">
              You can also{" "}
              <Link
                href="/talk"
                onClick={dismiss}
                className="text-[var(--accent)] underline-offset-2 hover:underline"
              >
                talk to it
              </Link>{" "}
              instead of typing. Read this again anytime from "How it works" at the top.
            </p>

            <button
              onClick={dismiss}
              className="mt-5 w-full cursor-pointer rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[#1a1206] transition hover:brightness-110"
            >
              Got it, let's start
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
