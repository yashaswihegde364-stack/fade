"use client";

import { useEffect, useRef } from "react";
import { AnimSetting } from "@/lib/storage";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hueOffset: number;
  depth: number;
}

function colorForS(s: number, depth: number) {
  const warmHue = 24 + depth * 10;
  const coolHue = 210;
  const hue = warmHue + (coolHue - warmHue) * (1 - s / 100);
  const sat = 20 + (s / 100) * 55;
  const light = 35 + (s / 100) * 20;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

interface Burst extends Particle {
  life: number;
}

export default function ParticleField({
  S,
  anim,
  loop = false,
  interactive = false,
  onTap,
}: {
  S: number;
  anim: AnimSetting;
  loop?: boolean;
  interactive?: boolean;
  onTap?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sRef = useRef(S);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const loopTRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const burstsRef = useRef<Burst[]>([]);

  useEffect(() => {
    sRef.current = S;
  }, [S]);

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

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const maxCount = isMobile ? 70 : 160;

    function spawn(count: number) {
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 0.6 + Math.random() * 2.2,
        hueOffset: Math.random() * 20 - 10,
        depth: Math.random(),
      }));
    }
    spawn(maxCount);

    function onMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX / width, y: e.clientY / height };
    }
    if (anim === "full") window.addEventListener("mousemove", onMove);

    function spawnBurst(x: number, y: number) {
      const n = anim === "off" ? 0 : 18;
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
        const speed = 1.2 + Math.random() * 2.2;
        burstsRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1.5 + Math.random() * 2,
          hueOffset: 0,
          depth: Math.random(),
          life: 1,
        });
      }
    }

    function onDown(e: PointerEvent) {
      if (!interactive) return;
      const rect = canvas!.getBoundingClientRect();
      spawnBurst(e.clientX - rect.left, e.clientY - rect.top);
      onTap?.();
    }
    if (interactive) canvas.addEventListener("pointerdown", onDown);

    function draw() {
      if (!ctx) return;
      let s = sRef.current;
      if (loop) {
        loopTRef.current += 0.0045;
        const phase = (Math.sin(loopTRef.current) + 1) / 2;
        s = 100 - phase * 100;
      }
      const frac = s / 100;
      const activeCount =
        anim === "off" ? 0 : Math.round(maxCount * (0.08 + frac * 0.92) * (anim === "reduced" ? 0.5 : 1));

      ctx.clearRect(0, 0, width, height);

      if (anim === "off") {
        const hue = 215 - frac * 190;
        ctx.fillStyle = `hsl(${hue}, 25%, ${10 + frac * 8}%)`;
        ctx.fillRect(0, 0, width, height);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const parallaxX = anim === "full" ? (mouseRef.current.x - 0.5) * 18 : 0;
      const parallaxY = anim === "full" ? (mouseRef.current.y - 0.5) * 18 : 0;

      const speedMul = anim === "reduced" ? 0.35 : 0.4 + frac * 1.1;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        if (i >= activeCount) continue;
        p.x += p.vx * speedMul;
        p.y += p.vy * speedMul;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const px = p.x + parallaxX * p.depth;
        const py = p.y + parallaxY * p.depth;

        ctx.beginPath();
        ctx.fillStyle = colorForS(Math.min(100, s + p.hueOffset), p.depth);
        ctx.globalAlpha = 0.35 + frac * 0.5 + p.depth * 0.15;
        ctx.arc(px, py, p.r * (0.7 + frac * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (burstsRef.current.length) {
        burstsRef.current = burstsRef.current.filter((b) => b.life > 0.02);
        for (const b of burstsRef.current) {
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.96;
          b.vy *= 0.96;
          b.life *= 0.94;
          ctx.beginPath();
          ctx.fillStyle = "var(--accent)".startsWith("var") ? "#ff8a5b" : "#ff8a5b";
          ctx.globalAlpha = b.life;
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      if (interactive) canvas.removeEventListener("pointerdown", onDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [anim, loop, interactive, onTap]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
