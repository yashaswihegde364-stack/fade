"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mic, Square } from "lucide-react";
import Companion, { Mood } from "@/components/Companion";
import { createRecognizer, isSpeechRecognitionSupported, speakNatural, stopSpeaking } from "@/lib/voice";
import { getAnimSetting } from "@/lib/storage";

interface Turn {
  role: "user" | "companion";
  content: string;
}

export default function Talk() {
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [turns, setTurns] = useState<Turn[]>([
    { role: "companion", content: "Hey. I'm here. What's going on?" },
  ]);
  const [anim, setAnim] = useState<ReturnType<typeof getAnimSetting>>("full");
  const [mood, setMood] = useState<{ mood: Mood; id: number } | null>(null);
  const recognizerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const turnsRef = useRef<Turn[]>(turns);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    setAnim(getAnimSetting());
    speakNatural("Hey. I'm here. What's going on?");
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function startListening() {
    stopSpeaking();
    const recognizer = createRecognizer(
      (text) => handleUserSpeech(text),
      () => setStatus((s) => (s === "listening" ? "idle" : s)),
    );
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    setStatus("listening");
    try {
      recognizer.start();
    } catch {
      setStatus("idle");
    }
  }

  function stopListening() {
    recognizerRef.current?.stop();
    setStatus("idle");
  }

  async function handleUserSpeech(text: string) {
    setStatus("thinking");
    const nextTurns = [...turnsRef.current, { role: "user" as const, content: text }];
    setTurns(nextTurns);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextTurns }),
      });
      const data = await res.json();
      const reply = data.reply || "I'm here.";
      setTurns((t) => [...t, { role: "companion", content: reply }]);
      setMood({ mood: "happy", id: Date.now() });
      setStatus("speaking");
      speakNatural(reply, {
        onEnd: () => setStatus("idle"),
      });
    } catch {
      setStatus("idle");
    }
  }

  const S = status === "listening" ? 90 : status === "speaking" ? 70 : status === "thinking" ? 50 : 35;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 -translate-y-[10%]">
        <Companion S={S} anim={anim} moodTrigger={mood} />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(90% 60% at 50% 100%, transparent, var(--bg) 85%)" }}
      />

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="mb-2 flex w-fit items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft size={15} /> Back
        </Link>

        <div className="mt-[38vh] flex-1 overflow-hidden sm:mt-[42vh]">
          <div
            ref={scrollRef}
            className="mx-auto h-full max-w-lg space-y-2.5 overflow-y-auto pb-4"
          >
            {turns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    t.role === "user"
                      ? "bg-[var(--accent)] text-[#1a1206]"
                      : "border border-[var(--border)] bg-[var(--card)]"
                  }`}
                >
                  {t.content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center pb-6">
          {!supported ? (
            <p className="text-center text-sm text-[var(--muted)]">
              Voice chat needs Chrome or Edge. Try one of those for this page.
            </p>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.p
                  key={status}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 text-xs text-[var(--muted)]"
                >
                  {status === "idle" && "Tap to talk"}
                  {status === "listening" && "Listening..."}
                  {status === "thinking" && "Thinking..."}
                  {status === "speaking" && "Speaking..."}
                </motion.p>
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={status === "listening" ? stopListening : startListening}
                disabled={status === "thinking" || status === "speaking"}
                className={`relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full transition disabled:opacity-50 ${
                  status === "listening"
                    ? "bg-[var(--accent)] text-[#1a1206]"
                    : "border border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                {status === "listening" && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-[var(--accent)]"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {status === "listening" ? (
                  <Square size={20} className="relative" />
                ) : (
                  <Mic size={22} className="relative" />
                )}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
