# Fade

Starts loud. Gets quiet. You keep going.

Fade is a focus app for ADHD brains. ADHD brains under-respond to boring or delayed reward, so they
seek stimulation. Most focus apps either bore you or keep piling on gamification forever. Fade does
the opposite: a session starts **loud** — motion, sound, frequent check-ins and small rewards — and
slowly gets **quieter** until you're working with almost nothing on screen. Stimulation is training
wheels that come off on purpose. Over many sessions you need less of it to get going.

Built for a builder-round submission, by someone who has ADHD.

## Try it

- **Start a session** — set what you're avoiding, the smallest first step, and a duration.
- **90-second demo** — a full 25-minute session compressed into 90 seconds, so you can see the whole
  arc (loud → busy → calm → quiet → silent) without waiting.

## How it works

One number, `S` (Stimulation Level, 100 → 0), drives everything on screen: particle density and
speed, colour saturation, ambient sound volume, and how often a "still on it?" check-in appears. As
`S` falls, the UI gets quieter — from a big animated timer down to a thin progress line and almost
nothing else.

- **I drifted** — always-visible button. Bumps `S` back up by 20 and the session resumes fading from
  there, with a kind one-line response. No guilt, no streak reset.
- **Check-ins** — a small, non-blocking card (not a screen-blocking popup) that offers a tiny reward
  on tap and quietly fades away unanswered — no penalty messaging.
- **Results** — an animated fade curve of the whole session, stats, and a shareable link.
- **Progression** — if you reach Quiet or Silent, your next session starts a little lower than 100.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Framer Motion for UI animation, `<canvas>` for the ambient particle field
- Web Audio API for all sound — generated in code, no audio files
- Next.js API routes + Supabase Postgres for sessions, history, share pages and a live "people
  fading right now" counter
- Deployed on Vercel from GitHub

**The app works fully with no backend configured.** If Supabase is unreachable or the env vars are
missing, everything silently falls back to `localStorage` — a reviewer should never see a broken
screen.

## Running locally

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in your own Supabase project if you want the shared
backend (live counter, cross-device history, public share pages). Not required to run the app.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

Run `supabase/migration.sql` against your Supabase project to create the `sessions` and
`live_sessions` tables with row-level security (anyone can insert and read, nobody can update or
delete).

## Live link

https://fade-wine-two.vercel.app

## AI tools used

Built with Claude Code (Claude), including the open-source `ui-ux-pro-max` Claude Skill for design
guidance.
