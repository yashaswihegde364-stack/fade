"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function WelcomeNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("fade_welcome_seen")) return;
    const t = setTimeout(() => setShow(true), 3200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("fade_welcome_seen", "1");
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 shadow-xl"
        >
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-3 top-3 cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <X size={14} />
          </button>
          <p className="pr-5 text-sm text-[var(--fg)]">
            I have ADHD. This app is for people like us, who can do anything, when the moment is
            right.
          </p>
          <button
            onClick={dismiss}
            className="mt-3 cursor-pointer text-xs text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
