"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CurvePoint, DriftPoint, Zone, zoneForS, zoneDepth, CHECKIN_INTERVAL } from "./types";

interface EngineOptions {
  startLevel: number;
  durationSeconds: number;
  demo: boolean;
}

export interface CheckIn {
  id: number;
  openedAt: number;
}

export function useSessionEngine({ startLevel, durationSeconds, demo }: EngineOptions) {
  const [S, setS] = useState(startLevel);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [drifts, setDrifts] = useState<DriftPoint[]>([]);
  const [curve, setCurve] = useState<CurvePoint[]>([{ t: 0, s: startLevel }]);
  const [checkin, setCheckin] = useState<CheckIn | null>(null);
  const [checkinsAnswered, setCheckinsAnswered] = useState(0);
  const [checkinsMissed, setCheckinsMissed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [deepestZone, setDeepestZone] = useState<Zone>(zoneForS(startLevel));
  const [quietSeconds, setQuietSeconds] = useState(0);
  const [zoneFlash, setZoneFlash] = useState<Zone | null>(null);

  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);
  const lastSampleRef = useRef(0);
  const nextCheckinAtRef = useRef<number | null>(null);
  const checkinOpenRef = useRef(false);
  const checkinOpenedAtRef = useRef(0);
  const lastZoneRef = useRef<Zone>(zoneForS(startLevel));
  const rafRef = useRef<number | null>(null);
  const speed = demo ? durationSeconds === 0 ? 1 : 1500 / 90 : 1;
  const totalSessionSeconds = demo ? 1500 : durationSeconds;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const scheduleNextCheckin = useCallback(
    (fromElapsed: number) => {
      const zone = zoneForS(computeS(fromElapsed));
      const interval = CHECKIN_INTERVAL[zone];
      nextCheckinAtRef.current = interval ? fromElapsed + interval : null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function computeS(elapsedSec: number): number {
    const frac = Math.min(1, elapsedSec / totalSessionSeconds);
    return Math.max(0, startLevel * (1 - frac));
  }

  useEffect(() => {
    scheduleNextCheckin(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function frame(now: number) {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const dtReal = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      if (!pausedRef.current && elapsedRef.current < totalSessionSeconds) {
        elapsedRef.current += dtReal * speed;
      }

      const e = Math.min(elapsedRef.current, totalSessionSeconds);
      const s = computeS(e);
      setElapsed(e);
      setS(s);

      const zone = zoneForS(s);
      if (zone !== lastZoneRef.current) {
        if (zoneDepth(zone) > zoneDepth(lastZoneRef.current)) {
          setZoneFlash(zone);
          setTimeout(() => setZoneFlash(null), 1400);
        }
        lastZoneRef.current = zone;
        setDeepestZone((d) => (zoneDepth(zone) > zoneDepth(d) ? zone : d));
      }

      if (zone === "quiet" || zone === "silent") {
        setQuietSeconds((q) => q + dtReal * speed);
      }

      if (e - lastSampleRef.current > totalSessionSeconds / 60) {
        lastSampleRef.current = e;
        setCurve((c) => [...c, { t: e, s }]);
      }

      if (
        nextCheckinAtRef.current !== null &&
        e >= nextCheckinAtRef.current &&
        !checkinOpenRef.current &&
        e < totalSessionSeconds
      ) {
        checkinOpenRef.current = true;
        checkinOpenedAtRef.current = e;
        setCheckin({ id: Date.now(), openedAt: e });
      }

      if (e >= totalSessionSeconds) {
        setEnded(true);
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSessionSeconds, speed, startLevel]);

  const answerCheckin = useCallback(() => {
    setCheckin(null);
    checkinOpenRef.current = false;
    setCheckinsAnswered((n) => n + 1);
    setStreak((n) => n + 1);
    scheduleNextCheckin(elapsedRef.current);
  }, [scheduleNextCheckin]);

  const missCheckin = useCallback(() => {
    setCheckin(null);
    checkinOpenRef.current = false;
    setCheckinsMissed((n) => n + 1);
    setStreak(0);
    scheduleNextCheckin(elapsedRef.current);
  }, [scheduleNextCheckin]);

  const logDrift = useCallback(() => {
    const bump = (20 / startLevel) * totalSessionSeconds;
    elapsedRef.current = Math.max(0, elapsedRef.current - bump);
    const newS = computeS(elapsedRef.current);
    setDrifts((d) => [...d, { t: elapsedRef.current, s: newS }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLevel, totalSessionSeconds]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const realSecondsElapsed = demo ? (elapsed / 1500) * durationSeconds : elapsed;

  return {
    S,
    elapsed,
    realSecondsElapsed,
    totalSessionSeconds,
    zone: zoneForS(S),
    zoneFlash,
    paused,
    togglePause,
    ended,
    drifts,
    curve,
    logDrift,
    checkin,
    answerCheckin,
    missCheckin,
    checkinsAnswered,
    checkinsMissed,
    streak,
    deepestZone,
    quietSeconds,
  };
}
