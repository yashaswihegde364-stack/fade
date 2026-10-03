"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Companion, { Mood } from "./Companion";
import { getAnimSetting } from "@/lib/storage";

export default function SplashIntro() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [introS, setIntroS] = useState(18);
  const [mood, setMood] = useState<{ mood: Mood; id: number } | null>(null);
  const [showWordmark, setShowWordmark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getAnimSetting() === "off") return;
    if (sessionStorage.getItem("fade_intro_seen")) return;

    setVisible(true);
    const t1 = setTimeout(() => setIntroS(100), 250);
    const t2 = setTimeout(() => {
      setMood({ mood: "happy", id: 1 });
      setShowWordmark(true);
    }, 1150);
    const t3 = setTimeout(() => setExiting(true), 2000);
    const t4 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("fade_intro_seen", "1");
    }, 2550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15, filter: "blur(8px)" }}
          transition={{ duration: exiting ? 0.55 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]"
        >
          <div className="relative h-56 w-56">
            <Companion S={introS} anim="full" moodTrigger={mood} />
          </div>
          <AnimatePresence>
            {showWordmark && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute bottom-[28%] font-display text-3xl font-semibold tracking-tight"
              >
                fade
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
