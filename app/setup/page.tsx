"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, X, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { suggestFirstStep } from "@/lib/suggest";

export default function Setup() {
  const router = useRouter();
  const [task, setTask] = useState("Write the first draft of my essay");
  const [firstStep, setFirstStep] = useState("Open the document and write one sentence");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestVersion, setSuggestVersion] = useState(0);
  const [suggestSource, setSuggestSource] = useState<"ai" | "heuristic" | null>(null);

  async function handleSuggest() {
    if (!task.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      setFirstStep(data.step || suggestFirstStep(task));
      setSuggestSource(data.source === "ai" ? "ai" : "heuristic");
    } catch {
      setFirstStep(suggestFirstStep(task));
      setSuggestSource("heuristic");
    }
    setSuggestVersion((v) => v + 1);
    setSuggesting(false);
  }

  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [stepInput, setStepInput] = useState("");
  const [breakingDown, setBreakingDown] = useState(false);

  async function handleAiBreakdown() {
    if (!task.trim()) return;
    setShowBreakdown(true);
    setBreakingDown(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, mode: "breakdown" }),
      });
      const data = await res.json();
      if (Array.isArray(data.steps) && data.steps.length > 0) {
        setSteps(data.steps.slice(0, 5));
      }
    } catch {
      // keep existing steps on failure
    }
    setBreakingDown(false);
  }

  function addStep() {
    if (stepInput.trim() && steps.length < 5) {
      setSteps([...steps, stepInput.trim()]);
      setStepInput("");
    }
  }

  function start() {
    const mins = customDuration ? parseInt(customDuration, 10) || duration : duration;
    const params = new URLSearchParams({
      task,
      firstStep,
      minutes: String(mins),
      steps: JSON.stringify(steps),
    });
    router.push(`/session?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-8 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold">What are you avoiding?</h1>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={2}
          autoComplete="off"
          className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
        />

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-semibold">What&apos;s the smallest first step?</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSuggest}
            disabled={!task.trim() || suggesting}
            className="ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <motion.span
              animate={suggesting ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5, repeat: suggesting ? Infinity : 0, ease: "linear" }}
            >
              <Sparkles size={13} />
            </motion.span>
            Suggest a tiny step
          </motion.button>
        </div>
        <motion.textarea
          key={suggestVersion}
          initial={{ backgroundColor: "color-mix(in srgb, var(--accent) 18%, var(--card))" }}
          animate={{ backgroundColor: "var(--card)" }}
          transition={{ duration: 0.9 }}
          value={firstStep}
          onChange={(e) => setFirstStep(e.target.value)}
          rows={2}
          autoComplete="off"
          className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
        />
        {suggestSource && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[11px] text-[var(--muted)]"
          >
            {suggestSource === "ai" ? "suggested by AI" : "suggested"}
          </motion.p>
        )}

        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => setShowBreakdown((s) => !s)}
            className="cursor-pointer text-sm text-[var(--accent)] underline-offset-2 hover:underline"
          >
            {showBreakdown ? "Hide" : "Break it down"}
          </button>
          <button
            onClick={handleAiBreakdown}
            disabled={!task.trim() || breakingDown}
            className="flex cursor-pointer items-center gap-1 text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--fg)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            <motion.span
              animate={breakingDown ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5, repeat: breakingDown ? Infinity : 0, ease: "linear" }}
            >
              <Sparkles size={12} />
            </motion.span>
            Let AI break it down
          </button>
        </div>

        {showBreakdown && (
          <div className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
              >
                <span>{s}</span>
                <button
                  onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                  className="cursor-pointer text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {steps.length < 5 && (
              <div className="flex gap-2">
                <input
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStep()}
                  placeholder="Add a tiny step"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={addStep}
                  className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        <h2 className="mt-7 font-display text-xl font-semibold">How long?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              onClick={() => {
                setDuration(m);
                setCustomDuration("");
              }}
              className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                duration === m && !customDuration
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#1a1206]"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]"
              }`}
            >
              {m} min
            </button>
          ))}
          <input
            value={customDuration}
            onChange={(e) => setCustomDuration(e.target.value.replace(/\D/g, ""))}
            placeholder="Custom"
            className="w-24 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={start}
          className="mt-10 w-full cursor-pointer rounded-full bg-[var(--accent)] py-4 font-medium text-[#1a1206] transition hover:brightness-110"
        >
          Start
        </motion.button>
      </motion.div>
    </main>
  );
}
