import { getSessions, getBestStreak, getInbox, getTriedSounds } from "./storage";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const AMBIENT_TYPES = ["brown", "pink", "rain", "drone", "waterfall", "birds"];

export function computeAchievements(): Achievement[] {
  const sessions = getSessions().filter((s) => !s.isDemo);
  const total = sessions.length;
  const bestStreak = getBestStreak();
  const reachedSilent = sessions.some((s) => s.deepestZone === "silent");
  const hadDriftAndFinished = sessions.some((s) => s.drifts >= 1);
  const earlyBird = sessions.some((s) => new Date(s.createdAt).getHours() < 9);
  const nightOwl = sessions.some((s) => new Date(s.createdAt).getHours() >= 22);
  const inboxCount = getInbox().length;
  const soundsTried = getTriedSounds().filter((s) => AMBIENT_TYPES.includes(s)).length;
  const marathoner = sessions.some((s) => s.plannedMinutes >= 45);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualSeconds / 60, 0);

  return [
    {
      id: "first-fade",
      title: "First Fade",
      description: "Complete your first session",
      icon: "sparkle",
      unlocked: total >= 1,
    },
    {
      id: "five-sessions",
      title: "Getting Somewhere",
      description: "Complete 5 sessions",
      icon: "flame",
      unlocked: total >= 5,
    },
    {
      id: "ten-sessions",
      title: "Ten Deep",
      description: "Complete 10 sessions",
      icon: "flame",
      unlocked: total >= 10,
    },
    {
      id: "streak-3",
      title: "Three in a Row",
      description: "Reach a 3-day streak",
      icon: "calendar",
      unlocked: bestStreak >= 3,
    },
    {
      id: "streak-7",
      title: "A Full Week",
      description: "Reach a 7-day streak",
      icon: "calendar",
      unlocked: bestStreak >= 7,
    },
    {
      id: "silent",
      title: "Deep Diver",
      description: "Reach Silent in a session",
      icon: "moon",
      unlocked: reachedSilent,
    },
    {
      id: "drift-comeback",
      title: "Comeback Kid",
      description: "Drift and still finish a session",
      icon: "heart",
      unlocked: hadDriftAndFinished,
    },
    {
      id: "early-bird",
      title: "Early Bird",
      description: "Start a session before 9am",
      icon: "sunrise",
      unlocked: earlyBird,
    },
    {
      id: "night-owl",
      title: "Night Owl",
      description: "Start a session after 10pm",
      icon: "moon-star",
      unlocked: nightOwl,
    },
    {
      id: "brain-dump",
      title: "Brain Dump Pro",
      description: "Capture 5 stray thoughts",
      icon: "lightbulb",
      unlocked: inboxCount >= 5,
    },
    {
      id: "sound-explorer",
      title: "Sound Explorer",
      description: "Try 4 different ambient sounds",
      icon: "waves",
      unlocked: soundsTried >= 4,
    },
    {
      id: "marathoner",
      title: "Marathoner",
      description: "Complete a 45-minute session",
      icon: "timer",
      unlocked: marathoner,
    },
    {
      id: "hour-club",
      title: "Hour Club",
      description: "Spend 60 total minutes focused",
      icon: "hourglass",
      unlocked: totalMinutes >= 60,
    },
  ];
}
