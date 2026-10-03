"use client";

import { useEffect, useRef } from "react";
import { AnimSetting } from "@/lib/storage";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

function bodyColor(s: number) {
  const warmHue = 24;
  const coolHue = 205;
  const hue = warmHue + (coolHue - warmHue) * (1 - s / 100);
  const sat = 55 + (s / 100) * 25;
  const light = 55 + (s / 100) * 10;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export type Mood = "idle" | "happy" | "startled";

export type Species = "blob" | "dino";
export type Accessory = "none" | "sparkle" | "glow";

export default function Companion({
  S,
  anim,
  moodTrigger,
  interactive = false,
  loop = false,
  species = "blob",
  accessory = "none",
  onTap,
}: {
  S: number;
  anim: AnimSetting;
  moodTrigger?: { mood: Mood; id: number } | null;
  interactive?: boolean;
  loop?: boolean;
  species?: Species;
  accessory?: Accessory;
  onTap?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sRef = useRef(S);
  const speciesRef = useRef(species);
  const accessoryRef = useRef(accessory);
  const loopTRef = useRef(0);
  const moodRef = useRef<{ mood: Mood; startedAt: number } | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const centerPulseRef = useRef(0);

  useEffect(() => {
    sRef.current = S;
  }, [S]);

  useEffect(() => {
    speciesRef.current = species;
  }, [species]);

  useEffect(() => {
    accessoryRef.current = accessory;
  }, [accessory]);

  useEffect(() => {
    if (moodTrigger) {
      moodRef.current = { mood: moodTrigger.mood, startedAt: performance.now() };
      if (moodTrigger.mood === "happy") {
        centerPulseRef.current = 1;
      }
    }
  }, [moodTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const parent = canvas!.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = width + "px";
      canvas!.style.height = height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function spawnSparks(cx: number, cy: number, n: number, color: string) {
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2.5;
        sparksRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          r: 1.5 + Math.random() * 2,
        });
      }
      void color;
    }

    function onDown(e: PointerEvent) {
      if (!interactive) return;
      const rect = canvas!.getBoundingClientRect();
      spawnSparks(e.clientX - rect.left, e.clientY - rect.top, 10, bodyColor(sRef.current));
      onTap?.();
    }
    if (interactive) canvas.addEventListener("pointerdown", onDown);

    function drawBlobEye(
      cx: number,
      cy: number,
      openness: number,
      r: number,
      pupilShift: number,
    ) {
      ctx!.save();
      ctx!.fillStyle = "#16181c";
      ctx!.beginPath();
      ctx!.ellipse(cx + pupilShift, cy, r, r * Math.max(0.08, openness), 0, 0, Math.PI * 2);
      ctx!.fill();
      if (openness > 0.3) {
        ctx!.fillStyle = "rgba(255,255,255,0.85)";
        ctx!.beginPath();
        ctx!.arc(cx + pupilShift - r * 0.3, cy - r * 0.3 * openness, r * 0.25, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = 16;
      tRef.current += dt;
      let s = sRef.current;
      if (loop) {
        loopTRef.current += 0.006;
        const phase = (Math.sin(loopTRef.current) + 1) / 2;
        s = 100 - phase * 100;
      }
      const frac = s / 100;
      const reduced = anim === "reduced";
      const off = anim === "off";

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 10;
      const baseR = Math.min(width, height) * 0.14;

      let mood: Mood = "idle";
      let moodProgress = 0;
      if (moodRef.current) {
        const elapsed = now - moodRef.current.startedAt;
        const duration = moodRef.current.mood === "startled" ? 900 : 1100;
        moodProgress = Math.min(1, elapsed / duration);
        mood = moodRef.current.mood;
        if (moodProgress >= 1) moodRef.current = null;
      }

      const energy = off ? 0.15 : reduced ? frac * 0.5 : frac;
      const bounceSpeed = 0.0016 + energy * 0.005;
      const bounceAmp = off ? 0 : (6 + energy * 16) * (reduced ? 0.5 : 1);
      let bob = Math.sin(tRef.current * bounceSpeed) * bounceAmp;
      let squashX = 1;
      let squashY = 1;
      let tilt = 0;

      if (mood === "happy") {
        const bounce = Math.sin(moodProgress * Math.PI) * 18 * (1 - moodProgress);
        bob -= bounce;
        squashY = 1 + Math.sin(moodProgress * Math.PI) * 0.18;
        squashX = 1 - Math.sin(moodProgress * Math.PI) * 0.12;
      } else if (mood === "startled") {
        tilt = Math.sin(moodProgress * Math.PI * 3) * (1 - moodProgress) * 0.18;
        squashX = 1 + Math.sin(moodProgress * Math.PI) * 0.1;
        squashY = 1 - Math.sin(moodProgress * Math.PI) * 0.08;
      }

      const color = off ? "#8a9099" : bodyColor(s);
      const accessoryBoost = accessoryRef.current !== "none" ? 0.15 : 0;
      const glowAlpha = off ? 0 : 0.25 + energy * 0.35 + accessoryBoost;

      if (!off) {
        const grad = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, baseR * 2.6);
        grad.addColorStop(0, color.replace("hsl", "hsla").replace(")", `, ${glowAlpha})`));
        grad.addColorStop(1, color.replace("hsl", "hsla").replace(")", ", 0)"));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.rotate(tilt);
      ctx.scale(squashX, squashY);

      if (!off && energy > 0.15 && speciesRef.current === "blob") {
        const earWiggle = Math.sin(tRef.current * 0.004) * energy * 0.3;
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.save();
        ctx.translate(-baseR * 0.55, -baseR * 0.95);
        ctx.rotate(-0.4 + earWiggle);
        ctx.beginPath();
        ctx.ellipse(0, 0, baseR * 0.18, baseR * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(baseR * 0.55, -baseR * 0.95);
        ctx.rotate(0.4 - earWiggle);
        ctx.beginPath();
        ctx.ellipse(0, 0, baseR * 0.18, baseR * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }

      if (!off && speciesRef.current === "dino") {
        const wag = Math.sin(tRef.current * 0.005) * 0.3;
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;

        ctx.save();
        ctx.translate(baseR * 0.75, baseR * 0.55);
        ctx.rotate(0.5 + wag);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(baseR * 0.55, baseR * 0.1, baseR * 0.85, -baseR * 0.15);
        ctx.quadraticCurveTo(baseR * 0.5, baseR * 0.25, 0, baseR * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const spikeXs = [-0.25, 0.05, 0.35];
        spikeXs.forEach((fx, i) => {
          ctx.beginPath();
          const sx = baseR * fx;
          const sy = -baseR * 0.88 + i * 1;
          ctx.moveTo(sx - baseR * 0.09, sy + baseR * 0.14);
          ctx.lineTo(sx, sy - baseR * 0.12);
          ctx.lineTo(sx + baseR * 0.09, sy + baseR * 0.14);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, baseR, baseR * 0.94, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.ellipse(-baseR * 0.3, -baseR * 0.35, baseR * 0.38, baseR * 0.26, -0.4, 0, Math.PI * 2);
      ctx.fill();

      let eyeOpenness = off ? 0.35 : 0.4 + energy * 0.65;
      let pupilShift = 0;
      if (mood === "startled") {
        eyeOpenness = 1;
        pupilShift = Math.sin(moodProgress * Math.PI * 4) * 2;
      } else if (mood === "happy") {
        eyeOpenness = 0.15 + 0.15 * Math.abs(Math.sin(moodProgress * Math.PI * 2));
      } else if (!off) {
        eyeOpenness *= 0.85 + Math.sin(tRef.current * 0.0012) * 0.15;
      }

      const eyeR = baseR * 0.16;
      drawBlobEye(-baseR * 0.32, -baseR * 0.06, eyeOpenness, eyeR, pupilShift);
      drawBlobEye(baseR * 0.32, -baseR * 0.06, eyeOpenness, eyeR, pupilShift);

      ctx.strokeStyle = "rgba(22,24,28,0.6)";
      ctx.lineWidth = Math.max(1.5, baseR * 0.035);
      ctx.lineCap = "round";
      ctx.beginPath();
      if (mood === "happy") {
        ctx.arc(0, baseR * 0.22, baseR * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
      } else if (mood === "startled") {
        ctx.ellipse(0, baseR * 0.3, baseR * 0.08, baseR * 0.1, 0, 0, Math.PI * 2);
      } else {
        const smile = 0.08 + energy * 0.12;
        ctx.arc(0, baseR * (0.18 - smile * 0.3), baseR * 0.2, 0.2 * Math.PI, (1 - 0.2) * Math.PI);
      }
      ctx.stroke();

      ctx.restore();

      if (!off && accessoryRef.current === "sparkle") {
        const starPositions = [
          { a: 0.9, d: 1.25 },
          { a: 2.5, d: 1.35 },
          { a: 4.3, d: 1.2 },
        ];
        starPositions.forEach((sp, i) => {
          const twinkle = (Math.sin(tRef.current * 0.0025 + i * 2.1) + 1) / 2;
          const sx = cx + Math.cos(sp.a) * baseR * sp.d;
          const sy = cy + Math.sin(sp.a) * baseR * sp.d - baseR * 0.6;
          const r = baseR * 0.07 * (0.6 + twinkle * 0.6);
          ctx.save();
          ctx.globalAlpha = 0.35 + twinkle * 0.6;
          ctx.fillStyle = "#ffe08a";
          ctx.beginPath();
          ctx.moveTo(sx, sy - r);
          ctx.lineTo(sx + r * 0.3, sy - r * 0.3);
          ctx.lineTo(sx + r, sy);
          ctx.lineTo(sx + r * 0.3, sy + r * 0.3);
          ctx.lineTo(sx, sy + r);
          ctx.lineTo(sx - r * 0.3, sy + r * 0.3);
          ctx.lineTo(sx - r, sy);
          ctx.lineTo(sx - r * 0.3, sy - r * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      if (sparksRef.current.length) {
        sparksRef.current = sparksRef.current.filter((p) => p.life > 0.03);
        for (const p of sparksRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.vx *= 0.97;
          p.life *= 0.93;
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.globalAlpha = p.life;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (mood === "happy" && centerPulseRef.current > 0.01) {
        if (sparksRef.current.length < 4) {
          spawnSparks(cx, cy - baseR, 14, color);
        }
        centerPulseRef.current *= 0.9;
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (interactive) canvas.removeEventListener("pointerdown", onDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [anim, interactive, onTap, loop]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
