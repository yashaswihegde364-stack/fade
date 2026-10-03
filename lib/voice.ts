"use client";

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices();
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  return (
    voices.find((v) => /female|samantha|victoria|zira|google us english/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0]
  );
}

export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = opts?.rate ?? 0.98;
    utter.pitch = opts?.pitch ?? 1.05;
    utter.volume = 0.85;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore - voice is a nice-to-have, never block the app
  }
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {}
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {}
    currentAudio = null;
  }
}

let currentAudio: HTMLAudioElement | null = null;
let naturalVoiceFailed = false;

export async function speakNatural(
  text: string,
  opts?: { voice?: string; onStart?: () => void; onEnd?: () => void },
): Promise<void> {
  if (typeof window === "undefined") return;
  if (naturalVoiceFailed) {
    speak(text);
    opts?.onStart?.();
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(check);
        opts?.onEnd?.();
      }
    }, 150);
    return;
  }
  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: opts?.voice }),
    });
    if (!res.ok) throw new Error("tts failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(url);
    currentAudio = audio;
    opts?.onStart?.();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      opts?.onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      opts?.onEnd?.();
    };
    await audio.play();
  } catch {
    naturalVoiceFailed = true;
    speak(text);
    opts?.onStart?.();
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(check);
        opts?.onEnd?.();
      }
    }, 150);
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function createRecognizer(onResult: (text: string) => void, onEnd: () => void) {
  if (typeof window === "undefined") return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const recognizer = new SR();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = "en-US";
  recognizer.onresult = (e: any) => {
    const transcript = e.results[0]?.[0]?.transcript;
    if (transcript) onResult(transcript);
  };
  recognizer.onend = onEnd;
  recognizer.onerror = onEnd;
  return recognizer;
}
