import { SessionResult } from "./types";

const DEVICE_ID_KEY = "fade_device_id";
const SESSIONS_KEY = "fade_sessions";
const SOUND_KEY = "fade_sound_settings";
const ANIM_KEY = "fade_anim_setting";
const START_LEVEL_KEY = "fade_start_level";
const PENDING_KEY = "fade_pending_session";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function newSessionId(): string {
  return uuid();
}

export function saveSession(session: SessionResult) {
  if (typeof window === "undefined") return;
  const all = getSessions();
  all.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all.slice(0, 200)));
  localStorage.setItem(PENDING_KEY, JSON.stringify(session));

  fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  }).catch(() => {});
}

export function getSessions(): SessionResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSessionById(id: string): SessionResult | null {
  return getSessions().find((s) => s.id === id) ?? null;
}

export function getLastSession(): SessionResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export interface SoundSettings {
  masterVolume: number;
  ambientVolume: number;
  chimeVolume: number;
  muted: boolean;
  ambientType: "brown" | "pink" | "rain" | "drone";
}

export const DEFAULT_SOUND: SoundSettings = {
  masterVolume: 0.7,
  ambientVolume: 0.6,
  chimeVolume: 0.8,
  muted: false,
  ambientType: "brown",
};

export function getSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SOUND;
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw ? { ...DEFAULT_SOUND, ...JSON.parse(raw) } : DEFAULT_SOUND;
  } catch {
    return DEFAULT_SOUND;
  }
}

export function saveSoundSettings(s: SoundSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, JSON.stringify(s));
}

export type AnimSetting = "full" | "reduced" | "off";

export function getAnimSetting(): AnimSetting {
  if (typeof window === "undefined") return "full";
  const raw = localStorage.getItem(ANIM_KEY);
  if (raw === "full" || raw === "reduced" || raw === "off") return raw;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }
  return "full";
}

export function saveAnimSetting(s: AnimSetting) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANIM_KEY, s);
}

export function getStartLevel(): number {
  if (typeof window === "undefined") return 100;
  const raw = localStorage.getItem(START_LEVEL_KEY);
  const n = raw ? parseInt(raw, 10) : 100;
  return Number.isFinite(n) ? n : 100;
}

export function saveStartLevel(n: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(START_LEVEL_KEY, String(n));
}

export function getStreak(): number {
  const sessions = getSessions().filter((s) => !s.isDemo);
  let streak = 0;
  const seenDays = new Set<string>();
  for (const s of sessions) {
    const day = s.createdAt.slice(0, 10);
    seenDays.add(day);
  }
  const days = Array.from(seenDays).sort().reverse();
  const today = new Date();
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (days[i] === expectedStr) streak++;
    else break;
  }
  return streak;
}
