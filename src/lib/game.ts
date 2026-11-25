import type { DailyEntry, Group } from "./types";

export const MAX_GUESSES = 6;
const EPOCH = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;
const HALF_EARTH_KM = 20_015;

export type GroupSummary = Pick<Group, "id" | "name" | "aliases" | "population" | "lat" | "lon"> & { countries: string[] };
type Point = Pick<Group, "lat" | "lon">;

export function summarize(g: Group): GroupSummary {
  return {
    id: g.id,
    name: g.name,
    aliases: g.aliases,
    countries: g.countries.slice(0, 4).map((c) => c.name),
    population: g.population,
    lat: g.lat,
    lon: g.lon,
  };
}

export type TileState = "match" | "partial" | "miss";
export type Compass = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type Feedback = {
  correct: boolean;
  continent: TileState;
  region: TileState;
  country: TileState;
  population: "higher" | "lower" | "match";
  family: TileState;
  branch: TileState;
  religion: TileState;
  distanceKm: number;
  bearing: number;
  direction: Compass | null;
  proximity: number;
};

export function dateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function dayIndex(date: Date): number {
  return Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / DAY_MS);
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type IdSet = { has(id: string): boolean };
export type Puzzle = { day: number; entry: DailyEntry };

function schedule(entries: DailyEntry[], groupIds: IdSet): DailyEntry[] {
  const shuffled = entries.filter((e) => groupIds.has(e.groupId));
  const random = mulberry32(20260101);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function puzzleForDay(entries: DailyEntry[], groupIds: IdSet, day: number): Puzzle | null {
  const pool = schedule(entries, groupIds);
  if (pool.length === 0) return null;
  return { day, entry: pool[((day % pool.length) + pool.length) % pool.length] };
}

export function demoPuzzle(entries: DailyEntry[], groupIds: IdSet, param: string): Puzzle | null {
  const pool = schedule(entries, groupIds);
  const byGroup = pool.findIndex((e) => e.groupId === param);
  if (byGroup >= 0) return { day: byGroup, entry: pool[byGroup] };
  if (!/^\d+$/.test(param) || Number(param) < 1) return null;
  return puzzleForDay(entries, groupIds, Number(param) - 1);
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export type Suggestion = { group: GroupSummary; matched: string; viaAlias: boolean };

export function search(groups: GroupSummary[], query: string, exclude: Set<string>): Suggestion[] {
  const q = normalize(query);
  if (!q) return [];
  const ranked: { s: Suggestion; rank: number }[] = [];
  for (const group of groups) {
    if (exclude.has(group.id)) continue;
    let best: { rank: number; matched: string; viaAlias: boolean } | null = null;
    [group.name, ...group.aliases].forEach((label, i) => {
      const n = normalize(label);
      const rank = n.startsWith(q) ? 0 : n.split(" ").some((w) => w.startsWith(q)) ? 1 : n.includes(q) ? 2 : -1;
      if (rank < 0) return;
      const score = rank * 2 + (i === 0 ? 0 : 1);
      if (!best || score < best.rank) best = { rank: score, matched: label, viaAlias: i > 0 };
    });
    if (best) {
      const { rank, matched, viaAlias } = best;
      ranked.push({ s: { group, matched, viaAlias }, rank });
    }
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || b.s.group.population - a.s.group.population)
    .map((r) => r.s);
}

const toRad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearing(a: Point, b: Point): number {
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS: Compass[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function compass(deg: number): Compass {
  return COMPASS[Math.round(deg / 45) % 8];
}

const same = (a: string | null, b: string | null): TileState => (a !== null && a === b ? "match" : "miss");

export function compare(guess: Group, answer: Group): Feedback {
  const correct = guess.id === answer.id;
  const g = new Set(guess.primaryCountries);
  const shared = answer.primaryCountries.filter((c) => g.has(c)).length;
  const country: TileState =
    shared === 0 ? "miss" : shared === g.size && shared === answer.primaryCountries.length ? "match" : "partial";
  const km = correct ? 0 : distanceKm(guess, answer);
  const deg = bearing(guess, answer);
  return {
    correct,
    continent: same(guess.continent, answer.continent),
    region: same(guess.region, answer.region),
    country,
    population: answer.population === guess.population ? "match" : answer.population > guess.population ? "higher" : "lower",
    family: same(guess.languageFamily, answer.languageFamily),
    branch: guess.languageFamily === answer.languageFamily ? same(guess.languageBranch, answer.languageBranch) : "miss",
    religion: same(guess.religion, answer.religion),
    distanceKm: Math.round(km),
    bearing: deg,
    direction: correct || km < 1 ? null : compass(deg),
    proximity: correct ? 100 : Math.max(0, Math.floor((1 - km / HALF_EARTH_KM) * 100)),
  };
}

export function formatPopulation(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1e6) return `${n >= 1e7 ? Math.round(n / 1e6) : (n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}

export function countryLabel(group: Group, max = 2): string {
  const names = group.primaryCountries.map((iso) => group.countries.find((c) => c.iso3 === iso)?.name ?? iso);
  return names.length > max ? `${names.slice(0, max).join(", ")} +${names.length - max}` : names.join(", ");
}

const SQUARE: Record<TileState, string> = { match: "🟩", partial: "🟨", miss: "⬜" };
const ARROW: Record<Compass, string> = { N: "⬆️", NE: "↗️", E: "➡️", SE: "↘️", S: "⬇️", SW: "↙️", W: "⬅️", NW: "↖️" };

export function shareText(puzzle: number, feedback: Feedback[], won: boolean, url: string): string {
  const lines = feedback.map((f) => {
    const pop = f.population === "match" ? "🟩" : f.population === "higher" ? "⬆️" : "⬇️";
    const tiles = [f.continent, f.region, f.country].map((s) => SQUARE[s]).join("") + pop +
      [f.family, f.branch, f.religion].map((s) => SQUARE[s]).join("");
    return `${tiles} ${f.correct ? "🎯" : f.direction ? ARROW[f.direction] : "📍"} ${f.proximity}%`;
  });
  return [`peoPLE No. ${puzzle} ${won ? feedback.length : "X"}/${MAX_GUESSES}`, "", ...lines, "", url].join("\n");
}
