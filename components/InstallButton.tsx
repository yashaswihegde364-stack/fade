"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone) return null;
  if (!deferredPrompt && !isIOS) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSSheet(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex cursor-pointer items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <Download size={15} />
        <span className="hidden sm:inline">Add to home screen</span>
      </button>

      <AnimatePresence>
        {showIOSSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center"
            onClick={() => setShowIOSSheet(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-base font-semibold">Add Fade to your home screen</p>
                <button
                  onClick={() => setShowIOSSheet(false)}
                  className="cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <X size={16} />
                </button>
              </div>
              <ol className="space-y-2.5 text-sm text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  Tap the Share button <Share size={15} className="text-[var(--accent)]" /> in
                  Safari&apos;s toolbar
                </li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; in the top right</li>
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
