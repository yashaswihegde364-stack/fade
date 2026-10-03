# Fade

Starts loud. Gets quiet. You keep going.

**Live app:** https://fade-wine-two.vercel.app

Fade is a focus app for ADHD brains. ADHD brains under-respond to boring or delayed reward, so they
seek stimulation. Most focus apps either bore you or keep piling on gamification forever. Fade does
the opposite: a session starts **loud** — motion, sound, frequent check-ins and small rewards — and
slowly gets **quieter** until you're working with almost nothing on screen. Stimulation is training
wheels that come off on purpose. Over many sessions you need less of it to get going.

Built by someone who has ADHD, for people like us.

## How to use it

1. **Say what you're avoiding**, and the smallest first step. Stuck? Tap "Suggest a tiny step" (AI)
   or "Let AI break it down" to auto-generate 3–5 tiny steps.
2. **Pick a duration** and hit Start. The session opens **loud** — a small companion creature bounces
   with energy, ambient sound plays, colors shift.
3. **Stay with it.** Everything quietly fades as the session goes — the creature calms down, sound
   drops, check-ins get rarer, the timer shrinks to a thin line.
4. **Drifted?** Tap "I drifted" — no guilt, it just turns the stimulation back up a bit and keeps
   going. Overwhelmed? Tap "Too much right now? Go quiet" to jump straight to calm.
5. **Done** — see your fade curve, stats, and share a link. Reach Quiet or Silent and your next
   session starts a little lower, so you need less push each time.

You can also skip the setup screen entirely and just **talk to it** — a voice conversation with the
companion (speech in, natural AI voice out).

## Features

- **The core mechanic** — one number, `S` (Stimulation Level, 100 → 0), drives everything on screen:
  the companion creature's energy, particle motion, color, ambient volume, and check-in frequency.
- **Companion creature** — reacts to your focus state in real time; bounces and sparks on check-ins,
  flinches and comforts on drift. Reach a 3-day streak and it unlocks a sparkle; 7 days unlocks a
  deeper glow. (There's also a hidden dinosaur form — try typing "rawr" on the landing page.)
- **Demo mode** — a full 25-minute session compressed into 90 seconds, so you can see the whole arc
  without waiting.
- **AI task coaching** (Groq, `openai/gpt-oss-20b`) — suggests a tiny concrete first step, or breaks
  a task into a few small steps, from whatever you type. Falls back to an offline heuristic if no
  API key is configured, so the app never breaks.
- **Talk to Fade** — a live voice conversation with the companion: your speech is transcribed in the
  browser (Web Speech API), a short in-character reply is generated (Groq), and spoken back with a
  natural AI voice (Groq TTS, Orpheus model), falling back to the browser's built-in voice if either
  service is unavailable.
- **Brain dump** — a capture button on every screen lets you drop a stray thought without derailing
  focus; review and check them off anytime from the Inbox.
- **Sound mixer** — six ambient textures (brown noise, pink noise, rain, drone, waterfall, birds),
  all synthesized live with the Web Audio API. No audio files.
- **Achievements** — thirteen badges (first session, streaks, reaching Silent, surviving a drift,
  early bird/night owl, trying every sound, and more), computed from your real session data.
- **History** — mini fade curves per session, a streak counter, a trend chart of starting level over
  time, and weekly/all-time stats.
- **Break screen** — an optional guided-breathing pause after a real session, skippable anytime.
- **Share pages** — a public read-only card for one session's fade curve and stats, with Open Graph
  meta tags.
- **Installable (PWA)** — a real "Add to home screen" button with platform-specific instructions.
- **Accessibility & resilience** — reduced-motion and animation-off modes, keyboard shortcuts
  (Space/D/P/M in session), visible focus states, no flashing faster than 3/sec.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Framer Motion for UI animation, `<canvas>` for the companion creature and particle rendering
- Web Audio API for ambient sound and reward chimes — generated in code, no audio files
- Web Speech API (SpeechRecognition) for voice input
- Groq (`openai/gpt-oss-20b` for chat/suggestions, `canopylabs/orpheus-v1-english` for natural TTS)
- Next.js API routes + Supabase Postgres for sessions, history, share pages and a live "people
  fading right now" counter
- Deployed on Vercel from GitHub

**The app works fully with no backend or AI keys configured.** If Supabase or Groq are unreachable
or the env vars are missing, everything silently falls back to `localStorage` / offline heuristics /
the browser's built-in voice — a visitor should never see a broken screen.

## Running locally

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local`. None are required to run the app — each one just upgrades a
feature that otherwise degrades gracefully.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
GROQ_API_KEY=
```

- **Supabase** — enables the shared backend (live "people fading" counter, cross-device history,
  public share pages). Run `supabase/migration.sql` against your project first; it creates the
  `sessions` and `live_sessions` tables with row-level security (anyone can insert and read, nobody
  can update or delete).
- **GROQ_API_KEY** — enables AI task coaching and the natural voice in Talk to Fade. Get a free key
  at [console.groq.com](https://console.groq.com) (no credit card). For the natural TTS voice
  specifically, you'll also need to accept the Orpheus model's terms once, from your Groq console.

## AI tools used

Built with Claude Code (Claude), including the open-source `ui-ux-pro-max` Claude Skill for design
guidance. Task coaching, breakdown, conversation, and voice are powered by Groq at runtime.
