"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getInstructions(): string[] {
  if (typeof navigator === "undefined") return [];
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
  const isAndroid = /android/.test(ua);
  const isFirefox = /firefox/.test(ua);
  const isEdge = /edg\//.test(ua);
  const isMac = /macintosh/.test(ua) && !isIOS;

  if (isIOS && isSafari) {
    return [
      "Tap the Share icon in Safari's toolbar (square with an arrow)",
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right',
    ];
  }
  if (isAndroid && isFirefox) {
    return [
      "Tap the menu (⋮) in the top right",
      'Tap "Install" or "Add to Home screen"',
    ];
  }
  if (isAndroid) {
    return [
      "Tap the menu (⋮) in the top right",
      'Tap "Add to Home screen" or "Install app"',
    ];
  }
  if (isFirefox) {
    return [
      "Firefox desktop doesn't support installing web apps",
      "Try this in Chrome or Edge instead for a one-click install",
    ];
  }
  if (isEdge || isMac) {
    return [
      "Look for the install icon in the address bar (a small monitor with a down arrow)",
      "Or open the menu and choose \"Install Fade\"",
    ];
  }
  return [
    "Open your browser's menu",
    'Look for "Install app" or "Add to Home screen"',
  ];
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);
    setInstructions(getInstructions());

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowSheet(true);
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
        {showSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center"
            onClick={() => setShowSheet(false)}
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
                  onClick={() => setShowSheet(false)}
                  className="cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <X size={16} />
                </button>
              </div>
              <ol className="list-decimal space-y-2 pl-4 text-sm text-[var(--muted)]">
                {instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
