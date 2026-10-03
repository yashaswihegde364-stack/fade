"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { addInboxItem } from "@/lib/storage";

export default function GlobalCapture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  if (pathname.startsWith("/session") || pathname.startsWith("/break")) return null;

  function save() {
    if (text.trim()) {
      addInboxItem(text.trim());
      setText("");
      setOpen(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        aria-label="Capture a thought"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-lg backdrop-blur transition hover:border-[var(--accent)]"
      >
        <Lightbulb size={18} className="text-[var(--accent)]" />
      </motion.button>

      <AnimatePresence>
        {justSaved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 right-5 z-40 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[#1a1206]"
          >
            Saved to your{" "}
            <Link href="/inbox" className="underline">
              brain dump
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"
            >
              <p className="font-display text-base font-semibold">Quick, let it go</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Drop the thought here. You can find it later in your brain dump.
              </p>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    save();
                  }
                }}
                rows={2}
                autoComplete="off"
                placeholder="Don't forget to..."
                className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 cursor-pointer rounded-full border border-[var(--border)] py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="flex-1 cursor-pointer rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[#1a1206]"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
