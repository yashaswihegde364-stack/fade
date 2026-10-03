"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Trash2, Lightbulb } from "lucide-react";
import { getInbox, toggleInboxItem, removeInboxItem, InboxItem } from "@/lib/storage";

export default function Inbox() {
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    setItems(getInbox());
  }, []);

  function toggle(id: string) {
    toggleInboxItem(id);
    setItems(getInbox());
  }

  function remove(id: string) {
    removeInboxItem(id);
    setItems(getInbox());
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="flex items-center gap-2">
        <Lightbulb size={20} className="text-[var(--accent)]" />
        <h1 className="font-display text-2xl font-semibold">Brain dump</h1>
      </div>
      <p className="mt-1.5 text-sm text-[var(--muted)]">
        Everything you've dropped here so your brain didn't have to hold onto it.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">
          Nothing here yet. Use the capture button anywhere to drop a stray thought.
        </p>
      ) : (
        <div className="mt-8 space-y-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                  <button
                    onClick={() => toggle(item.id)}
                    className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border ${
                      item.done ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
                    }`}
                    aria-label="Toggle done"
                  />
                  <span
                    className={`flex-1 text-sm ${item.done ? "text-[var(--muted)] line-through" : ""}`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => remove(item.id)}
                    className="cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
