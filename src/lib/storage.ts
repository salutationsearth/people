import { MAX_GUESSES } from "./game";

export type Progress = { day: number; guesses: string[] };
export type Stats = {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  lastDay: number | null;
};

const PROGRESS_KEY = "peoPLE:progress";
const STATS_KEY = "peoPLE:stats";
const SEEN_KEY = "peoPLE:seen-how-to-play";

export const emptyStats = (): Stats => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: Array(MAX_GUESSES).fill(0),
  lastDay: null,
});

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadProgress(day: number): string[] {
  const p = read<Progress>(PROGRESS_KEY);
  return p && p.day === day ? p.guesses : [];
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadStats(): Stats {
  return { ...emptyStats(), ...read<Stats>(STATS_KEY) };
}

export function recordResult(day: number, won: boolean, guesses: number): Stats {
  const stats = loadStats();
  if (stats.lastDay === day) return stats;
  const streak = won ? (stats.lastDay === day - 1 ? stats.currentStreak + 1 : 1) : 0;
  const distribution = [...stats.distribution];
  if (won) distribution[guesses - 1] += 1;
  const next: Stats = {
    played: stats.played + 1,
    won: stats.won + (won ? 1 : 0),
    currentStreak: streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    distribution,
    lastDay: day,
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(next));
  return next;
}

export function hasSeenHowToPlay(): boolean {
  return read<boolean>(SEEN_KEY) === true;
}

export function markHowToPlaySeen() {
  localStorage.setItem(SEEN_KEY, "true");
}
