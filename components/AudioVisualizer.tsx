"use client";

import { useEffect, useRef } from "react";

export default function AudioVisualizer({
  analyser,
  color = "var(--accent)",
}: {
  analyser: AnalyserNode | null;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    let raf: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
      analyser!.getByteFrequencyData(data);
      ctx!.clearRect(0, 0, w, h);
      const bars = 28;
      const step = Math.floor(bufferLength / bars);
      const barWidth = w / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const barHeight = Math.max(2, v * h);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.35 + v * 0.5;
        ctx!.fillRect(i * barWidth + 1, h - barHeight, barWidth - 2, barHeight);
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser, color]);

  return <canvas ref={canvasRef} className="h-8 w-full" />;
}
