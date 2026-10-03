export type Zone = "loud" | "busy" | "calm" | "quiet" | "silent";

export interface CurvePoint {
  t: number;
  s: number;
}

export interface DriftPoint {
  t: number;
  s: number;
}

export interface Step {
  text: string;
  done: boolean;
}

export interface SessionResult {
  id: string;
  deviceId: string;
  task: string;
  firstStep: string;
  plannedMinutes: number;
  actualSeconds: number;
  startLevel: number;
  deepestZone: Zone;
  quietSeconds: number;
  drifts: number;
  checkinsAnswered: number;
  checkinsMissed: number;
  curve: CurvePoint[];
  driftPoints: DriftPoint[];
  isDemo: boolean;
  createdAt: string;
  steps?: Step[];
}

export function zoneForS(s: number): Zone {
  if (s > 80) return "loud";
  if (s > 60) return "busy";
  if (s > 40) return "calm";
  if (s > 15) return "quiet";
  return "silent";
}

export const ZONE_ORDER: Zone[] = ["loud", "busy", "calm", "quiet", "silent"];

export function zoneDepth(zone: Zone): number {
  return ZONE_ORDER.indexOf(zone);
}

export const CHECKIN_INTERVAL: Record<Zone, number | null> = {
  loud: 60,
  busy: 120,
  calm: 240,
  quiet: 480,
  silent: null,
};

export const ZONE_LABEL: Record<Zone, string> = {
  loud: "Loud",
  busy: "Busy",
  calm: "Calm",
  quiet: "Quiet",
  silent: "Silent",
};
