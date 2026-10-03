"use client";

import { SoundSettings } from "./storage";

class FadeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private chimeGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private started = false;
  private settings: SoundSettings;
  private sMultiplier = 1;

  constructor(settings: SoundSettings) {
    this.settings = settings;
  }

  private ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();
      this.chimeGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      this.ambientGain.connect(this.masterGain);
      this.chimeGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.applyVolumes();
    }
    return this.ctx;
  }

  start() {
    const ctx = this.ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (!this.started) {
      this.startAmbient();
      this.started = true;
    }
  }

  private noiseBuffer(ctx: AudioContext, color: "white" | "brown" | "pink") {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (color === "white") {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (color === "brown") {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    } else {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.11;
      }
    }
    return buffer;
  }

  private stopAmbient() {
    this.ambientNodes.forEach((n) => {
      try {
        (n as any).stop?.();
      } catch {}
      try {
        n.disconnect();
      } catch {}
    });
    this.ambientNodes = [];
  }

  startAmbient() {
    const ctx = this.ensureCtx();
    this.stopAmbient();
    const type = this.settings.ambientType;

    if (type === "drone") {
      const freqs = [110, 165, 220];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.12 / (i + 1);
        osc.connect(g);
        g.connect(this.ambientGain!);
        osc.start();
        this.ambientNodes.push(osc, g);
      });
      return;
    }

    if (type === "waterfall") {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx, "pink");
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 900;
      band.Q.value = 0.6;
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 300;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 260;
      lfo.connect(lfoGain);
      lfoGain.connect(band.frequency);
      lfo.start();
      src.connect(band);
      band.connect(high);
      high.connect(this.ambientGain!);
      src.start();
      this.ambientNodes.push(src, band, high, lfo, lfoGain);
      return;
    }

    if (type === "birds") {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx, "pink");
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.3;
      src.connect(filter);
      filter.connect(bedGain);
      bedGain.connect(this.ambientGain!);
      src.start();
      this.ambientNodes.push(src, filter, bedGain);

      const chirpLoop = () => {
        if (!this.ctx) return;
        this.playChirp();
        const next = 500 + Math.random() * 2200;
        chirpTimeout = setTimeout(chirpLoop, next);
      };
      let chirpTimeout = setTimeout(chirpLoop, 300);
      this.ambientNodes.push({
        disconnect: () => clearTimeout(chirpTimeout),
      } as any);
      return;
    }

    const color = type === "rain" ? "pink" : type === "pink" ? "pink" : "brown";
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, color as any);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = type === "rain" ? 3500 : 1200;

    src.connect(filter);
    filter.connect(this.ambientGain!);
    src.start();
    this.ambientNodes.push(src, filter);

    if (type === "rain") {
      const dropletInterval = setInterval(() => {
        if (!this.ctx) return;
        this.playDroplet();
      }, 180);
      this.ambientNodes.push({
        disconnect: () => clearInterval(dropletInterval),
      } as any);
    }
  }

  private playChirp() {
    const ctx = this.ensureCtx();
    const notes = 2 + Math.floor(Math.random() * 3);
    const baseFreq = 2200 + Math.random() * 1800;
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const t0 = ctx.currentTime + i * 0.09;
      const f0 = baseFreq + (Math.random() - 0.5) * 400;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * 0.3), t0 + 0.06);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.9, t0 + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.05, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      osc.connect(g);
      g.connect(this.ambientGain!);
      osc.start(t0);
      osc.stop(t0 + 0.14);
    }
  }

  private playDroplet() {
    const ctx = this.ensureCtx();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const freq = 1800 + Math.random() * 1200;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(g);
    g.connect(this.ambientGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  setAmbientType(type: SoundSettings["ambientType"]) {
    this.settings.ambientType = type;
    if (this.started) this.startAmbient();
  }

  playChime(pitch: "up" | "down" = "up") {
    if (this.settings.muted) return;
    const ctx = this.ensureCtx();
    const notes = pitch === "up" ? [523.25, 659.25, 783.99] : [659.25, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.08;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      osc.connect(g);
      g.connect(this.chimeGain!);
      osc.start(t0);
      osc.stop(t0 + 1);
    });
  }

  playBurst() {
    if (this.settings.muted) return;
    const ctx = this.ensureCtx();
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 400 + i * 180;
      const g = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.03;
      g.gain.setValueAtTime(0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      osc.connect(g);
      g.connect(this.chimeGain!);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    }
  }

  updateSettings(settings: SoundSettings, s: number) {
    this.settings = settings;
    this.sMultiplier = 0.15 + (s / 100) * 0.85;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.masterGain || !this.ambientGain || !this.chimeGain) return;
    const now = this.ctx!.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.linearRampToValueAtTime(master, now + 0.2);
    this.ambientGain.gain.linearRampToValueAtTime(
      this.settings.ambientVolume * this.sMultiplier,
      now + 0.3,
    );
    this.chimeGain.gain.linearRampToValueAtTime(this.settings.chimeVolume, now + 0.1);
  }

  getAnalyser() {
    return this.analyser;
  }

  dB(): number {
    if (this.settings.muted) return -Infinity;
    const v = this.settings.masterVolume;
    if (v <= 0.001) return -60;
    return Math.round(20 * Math.log10(v));
  }

  suspend() {
    this.ctx?.suspend();
  }
}

let engineInstance: FadeAudioEngine | null = null;

export function getAudioEngine(settings: SoundSettings): FadeAudioEngine {
  if (!engineInstance) {
    engineInstance = new FadeAudioEngine(settings);
  }
  return engineInstance;
}
