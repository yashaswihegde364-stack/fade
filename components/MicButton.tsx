"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";
import { createRecognizer, isSpeechRecognitionSupported } from "@/lib/voice";

export default function MicButton({ onResult }: { onResult: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  if (!supported) return null;

  function toggleListen() {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const recognizer = createRecognizer(
      (text) => onResult(text),
      () => setListening(false),
    );
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    setListening(true);
    try {
      recognizer.start();
    } catch {
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleListen}
      aria-label={listening ? "Stop listening" : "Speak instead of typing"}
      className={`relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition ${
        listening
          ? "border-[var(--accent)] bg-[var(--accent)] text-[#1a1206]"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--accent)]"
      }`}
    >
      {listening && (
        <motion.span
          className="absolute inset-0 rounded-full bg-[var(--accent)]"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {listening ? <Loader2 size={14} className="relative animate-spin" /> : <Mic size={14} className="relative" />}
    </button>
  );
}
