"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkle,
  Flame,
  Calendar,
  Moon,
  Heart,
  Sunrise,
  MoonStar,
  Lightbulb,
  Waves,
  Timer,
  Hourglass,
  Lock,
} from "lucide-react";
import { computeAchievements, Achievement } from "@/lib/achievements";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  sparkle: Sparkle,
  flame: Flame,
  calendar: Calendar,
  moon: Moon,
  heart: Heart,
  sunrise: Sunrise,
  "moon-star": MoonStar,
  lightbulb: Lightbulb,
  waves: Waves,
  timer: Timer,
  hourglass: Hourglass,
};

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    setAchievements(computeAchievements());
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Achievements</h1>
        <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm">
          {unlockedCount}/{achievements.length}
        </div>
      </div>
      <p className="mt-1.5 text-sm text-[var(--muted)]">
        Small proof you keep showing up. No pressure, just a record.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {achievements.map((a, i) => {
          const Icon = ICONS[a.icon] ?? Sparkle;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl border p-4 ${
                a.unlocked
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--card)] opacity-50"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  a.unlocked ? "bg-[var(--accent)] text-[#1a1206]" : "bg-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {a.unlocked ? <Icon size={16} /> : <Lock size={14} />}
              </div>
              <p className="mt-2.5 text-sm font-medium">{a.title}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{a.description}</p>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
