"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, Pause, Play, X, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import Companion, { Mood, Accessory } from "@/components/Companion";
import AudioVisualizer from "@/components/AudioVisualizer";
import { useSessionEngine } from "@/lib/useSessionEngine";
import { getAudioEngine } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/voice";
import {
  getAnimSetting,
  saveAnimSetting,
  AnimSetting,
  getSoundSettings,
  saveSoundSettings,
  SoundSettings,
  getDeviceId,
  newSessionId,
  saveSession,
  getStartLevel,
  saveStartLevel,
  addCapture,
  getCaptures,
  getCompanionUnlock,
  markSoundTried,
} from "@/lib/storage";
import { ZONE_LABEL, zoneDepth } from "@/lib/types";

function SessionInner() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const task = params.get("task") || "Focus session";
  const firstStep = params.get("firstStep") || "";
  const minutes = parseInt(params.get("minutes") || "25", 10);
  const initialSteps: string[] = useMemo(() => {
    try {
      return JSON.parse(params.get("steps") || "[]");
    } catch {
      return [];
    }
  }, [params]);

  const [startLevel] = useState(() => getStartLevel());
  const [accessory, setAccessory] = useState<Accessory>("none");

  useEffect(() => {
    setAccessory(getCompanionUnlock());
  }, []);
  const [steps, setSteps] = useState(initialSteps.map((s) => ({ text: s, done: false })));
  const [stepsOpen, setStepsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anim, setAnim] = useState<AnimSetting>("full");
  const [sound, setSound] = useState<SoundSettings>(getSoundSettings());
  const [audioStarted, setAudioStarted] = useState(false);
  const [driftMsg, setDriftMsg] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [sessionId] = useState(() => newSessionId());
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureCount, setCaptureCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [moodTrigger, setMoodTrigger] = useState<{ mood: Mood; id: number } | null>(null);
  const savedRef = useRef(false);
  const wakeLockRef = useRef<any>(null);

  const engine = useSessionEngine({
    startLevel,
    durationSeconds: minutes * 60,
    demo: isDemo,
  });

  useEffect(() => {
    setAnim(getAnimSetting());
  }, []);

  const audio = useMemo(() => getAudioEngine(sound), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    audio.updateSettings(sound, engine.S);
  }, [sound, engine.S, audio]);

  useEffect(() => {
    if (!wakeLockRef.current && "wakeLock" in navigator) {
      (navigator as any).wakeLock.request("screen").then(
        (lock: any) => (wakeLockRef.current = lock),
        () => {},
      );
    }
    return () => {
      wakeLockRef.current?.release?.().catch(() => {});
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    function beat() {
      fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: getDeviceId(), zone: engine.zone }),
      }).catch(() => {});
      fetch("/api/live")
        .then((r) => r.json())
        .then((d) => setLiveCount(d.total || 0))
        .catch(() => {});
    }
    beat();
    const id = setInterval(beat, 30000);
    return () => clearInterval(id);
  }, [engine.zone]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        if (engine.checkin) handleAnswer();
      } else if (e.key === "d" || e.key === "D") {
        handleDrift();
      } else if (e.key === "p" || e.key === "P") {
        engine.togglePause();
      } else if (e.key === "m" || e.key === "M") {
        setSound((s) => ({ ...s, muted: !s.muted }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.checkin]);

  useEffect(() => {
    if (!engine.checkin) return;
    const id = setTimeout(() => {
      engine.missCheckin();
    }, 20000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.checkin]);

  const prevZone = useRef(engine.zone);
  useEffect(() => {
    if (engine.zone !== prevZone.current) {
      if (zoneDepth(engine.zone) > zoneDepth(prevZone.current) && audioStarted) {
        audio.playChime("down");
        if (sound.voiceGuidance && !sound.muted) {
          const lines: Record<string, string> = {
            busy: "Settling in.",
            calm: "Getting quieter now.",
            quiet: "Almost there. Nearly silent.",
            silent: "Silent now. Just you and the work.",
          };
          const line = lines[engine.zone];
          if (line) speak(line);
        }
      }
      prevZone.current = engine.zone;
    }
  }, [engine.zone, audio, audioStarted, sound.voiceGuidance, sound.muted]);

  useEffect(() => {
    if (engine.ended && !savedRef.current) {
      savedRef.current = true;
      if (sound.voiceGuidance && !sound.muted) {
        speak("Session complete. Well done.");
      }
      const id = sessionId;
      const session = {
        id,
        deviceId: getDeviceId(),
        task,
        firstStep,
        plannedMinutes: minutes,
        actualSeconds: engine.realSecondsElapsed,
        startLevel,
        deepestZone: engine.deepestZone,
        quietSeconds: engine.quietSeconds,
        drifts: engine.drifts.length,
        checkinsAnswered: engine.checkinsAnswered,
        checkinsMissed: engine.checkinsMissed,
        curve: engine.curve,
        driftPoints: engine.drifts,
        isDemo,
        createdAt: new Date().toISOString(),
        steps,
      };
      saveSession(session);
      if (!isDemo) {
        if (engine.deepestZone === "quiet" || engine.deepestZone === "silent") {
          saveStartLevel(Math.max(50, startLevel - 8));
        }
      }
      if (isDemo) {
        router.push(`/results?id=${id}`);
      } else {
        router.push(`/break?next=${encodeURIComponent(`/results?id=${id}`)}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.ended]);

  function startAudioIfNeeded() {
    if (!audioStarted) {
      audio.start();
      setAudioStarted(true);
      markSoundTried(sound.ambientType);
      if (sound.voiceGuidance && !sound.muted) {
        speak(`Let's start. ${task}.`);
      }
    }
  }

  function handleAnswer() {
    startAudioIfNeeded();
    audio.playBurst();

    const roll = Math.random();
    if (roll < 0.1) {
      const messages = ["On a roll.", "That's the rhythm.", "Look at you go."];
      setRewardToast(messages[Math.floor(Math.random() * messages.length)]);
      setTimeout(() => setRewardToast(null), 1800);
      setTimeout(() => {
        audio.playBurst();
        setMoodTrigger({ mood: "happy", id: Date.now() + 1 });
      }, 260);
      if (navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {}
      }
    } else if (roll < 0.3) {
      setRewardToast("Nice.");
      setTimeout(() => setRewardToast(null), 1400);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {}
      }
    } else if (navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {}
    }

    setMoodTrigger({ mood: "happy", id: Date.now() });
    engine.answerCheckin();
  }

  function handleDrift() {
    startAudioIfNeeded();
    engine.logDrift();
    setMoodTrigger({ mood: "startled", id: Date.now() });
    setDriftMsg("Happens. Turning things back up a bit.");
    if (sound.voiceGuidance && !sound.muted) {
      speak("Happens. Turning things back up a bit.");
    }
    setTimeout(() => setDriftMsg(null), 2600);
  }

  function handleCalmNow() {
    engine.calmNow();
    setDriftMsg("Okay. Let's go quiet, right now.");
    setTimeout(() => setDriftMsg(null), 2600);
  }

  function toggleStep(i: number) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, done: !st.done } : st)));
  }

  function submitCapture() {
    if (captureText.trim()) {
      addCapture(sessionId, captureText.trim());
      setCaptureCount((c) => c + 1);
      setCaptureText("");
    }
    setCaptureOpen(false);
  }

  const S = engine.S;
  const timerScale = Math.max(0.3, S / 100);
  const remaining = Math.max(0, minutes * 60 - engine.realSecondsElapsed);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  const showBigTimer = S > 40;
  const dim = S <= 15;

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      onClick={startAudioIfNeeded}
    >
      <div className="absolute inset-0 -translate-y-[16%]">
        <Companion
          S={S}
          anim={anim}
          moodTrigger={moodTrigger}
          accessory={accessory}
          interactive
          onTap={() => {
            startAudioIfNeeded();
            audio.playBurst();
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(90% 70% at 50% 100%, transparent, var(--bg) 92%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-5 sm:px-8">
        <div className="flex items-start justify-between">
          <div className="max-w-xs">
            <p className="font-display text-base font-medium sm:text-lg">{task}</p>
            {firstStep && (
              <p className="mt-0.5 text-xs text-[var(--muted)] sm:text-sm">{firstStep}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
                Demo: time sped up
              </span>
            )}
            <button
              onClick={() => setCaptureOpen(true)}
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
              aria-label="Capture a thought"
            >
              <Lightbulb size={16} />
              {captureCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-semibold text-[#1a1206]">
                  {captureCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]"
              aria-label="Sound and animation settings"
            >
              {sound.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {((engine.streak > 0 && S > 15) || liveCount > 1) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 flex items-center justify-center gap-2 text-center text-[11px] text-[var(--muted)]"
          >
            {engine.streak > 0 && S > 15 && (
              <span>
                {engine.streak} check-in{engine.streak === 1 ? "" : "s"} in a row
              </span>
            )}
            {engine.streak > 0 && S > 15 && liveCount > 1 && <span>·</span>}
            {liveCount > 1 && <span>{liveCount} fading alongside you</span>}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={engine.zone}
            initial={{ opacity: 0 }}
            animate={{ opacity: dim ? 0.5 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
          >
            {ZONE_LABEL[engine.zone]}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-1 flex-col items-center justify-center">
          {showBigTimer ? (
            <motion.div
              animate={{ scale: timerScale }}
              transition={{ duration: 1.2 }}
              className="font-display text-7xl font-semibold tabular-nums sm:text-8xl"
            >
              {mm}:{String(ss).padStart(2, "0")}
            </motion.div>
          ) : (
            <div className="w-56 max-w-[60vw]">
              <div className="h-[2px] w-full overflow-hidden rounded-full bg-[var(--border)]">
                <motion.div
                  className="h-full bg-[var(--fg)] opacity-60"
                  style={{ width: `${(1 - remaining / (minutes * 60)) * 100}%` }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-[var(--muted)] opacity-70">
                {mm}:{String(ss).padStart(2, "0")} left
              </p>
            </div>
          )}

          {steps.length > 0 && S > 15 && (
            <div className="mt-8 w-full max-w-sm">
              <button
                onClick={() => setStepsOpen((o) => !o)}
                className="flex w-full cursor-pointer items-center justify-center gap-1 text-xs text-[var(--muted)]"
              >
                Steps {stepsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <AnimatePresence>
                {stepsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-1.5 overflow-hidden"
                  >
                    {steps.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => toggleStep(i)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-sm"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            s.done ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
                          }`}
                        />
                        <span className={s.done ? "text-[var(--muted)] line-through" : ""}>
                          {s.text}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {S > 20 && (
          <button
            onClick={handleCalmNow}
            className="mb-2 cursor-pointer self-center text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--fg)] hover:underline"
          >
            Too much right now? Go quiet
          </button>
        )}

        <div className="flex items-center justify-between gap-3 pb-2">
          <button
            onClick={engine.togglePause}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm"
          >
            {engine.paused ? <Play size={14} /> : <Pause size={14} />}
            {engine.paused ? "Resume" : "Pause"}
          </button>

          <button
            onClick={handleDrift}
            className="flex-1 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--card)] py-2.5 text-sm font-medium transition hover:border-[var(--accent)] active:scale-95"
          >
            I drifted
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm"
          >
            End
          </button>
        </div>
      </div>

      <AnimatePresence>
        {driftMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm backdrop-blur"
          >
            {driftMsg}
          </motion.div>
        )}
        {rewardToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#1a1206]"
          >
            {rewardToast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {captureOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center"
            onClick={() => setCaptureOpen(false)}
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
                Drop the thought here so your brain can stop holding onto it. You can read these
                back after.
              </p>
              <textarea
                autoFocus
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitCapture();
                  }
                }}
                rows={2}
                placeholder="Call the dentist, check that email..."
                className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setCaptureOpen(false)}
                  className="flex-1 cursor-pointer rounded-full border border-[var(--border)] py-2.5 text-sm"
                >
                  Discard
                </button>
                <button
                  onClick={submitCapture}
                  className="flex-1 cursor-pointer rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[#1a1206]"
                >
                  Drop it, keep going
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {engine.checkin && (
          <motion.button
            key={engine.checkin.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: "spring", damping: 18, stiffness: 300 }}
            onClick={handleAnswer}
            aria-label="Still on it? Tap to check in"
            className="fixed bottom-24 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1206] shadow-lg sm:right-7"
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-[var(--accent)]"
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative text-[10px] font-semibold leading-tight">
              still
              <br />
              on it?
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-t-3xl border border-[var(--border)] bg-[var(--bg)] p-6 sm:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-lg font-semibold">Settings</p>
                <button onClick={() => setSettingsOpen(false)} className="cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {audioStarted && (
                  <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-2">
                    <AudioVisualizer analyser={audio.getAnalyser()} />
                  </div>
                )}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span>Mute</span>
                    <button
                      onClick={() => {
                        const next = { ...sound, muted: !sound.muted };
                        setSound(next);
                        saveSoundSettings(next);
                      }}
                      className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1 text-xs"
                    >
                      {sound.muted ? "Unmute" : "Mute"}
                    </button>
                  </div>
                  <label className="mb-1 block text-xs text-[var(--muted)]">
                    Master volume ({audio.dB()} dB)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={sound.masterVolume}
                    onChange={(e) => {
                      const next = { ...sound, masterVolume: parseFloat(e.target.value) };
                      setSound(next);
                      saveSoundSettings(next);
                    }}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[var(--muted)]">Ambient bed</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={sound.ambientVolume}
                    onChange={(e) => {
                      const next = { ...sound, ambientVolume: parseFloat(e.target.value) };
                      setSound(next);
                      saveSoundSettings(next);
                    }}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[var(--muted)]">Reward chimes</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={sound.chimeVolume}
                    onChange={(e) => {
                      const next = { ...sound, chimeVolume: parseFloat(e.target.value) };
                      setSound(next);
                      saveSoundSettings(next);
                    }}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">Ambient sound</label>
                  <div className="flex flex-wrap gap-2">
                    {(["brown", "pink", "rain", "drone", "waterfall", "birds"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          const next = { ...sound, ambientType: t };
                          setSound(next);
                          saveSoundSettings(next);
                          audio.setAmbientType(t);
                          markSoundTried(t);
                        }}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs capitalize ${
                          sound.ambientType === t
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[#1a1206]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    Animation intensity
                  </label>
                  <div className="flex gap-2">
                    {(["full", "reduced", "off"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          setAnim(a);
                          saveAnimSetting(a);
                        }}
                        className={`flex-1 cursor-pointer rounded-full border py-1.5 text-xs capitalize ${
                          anim === a
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[#1a1206]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Session() {
  return (
    <Suspense fallback={null}>
      <SessionInner />
    </Suspense>
  );
}
