import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Country, Group } from "../src/lib/types";

const API = "https://api.joshuaproject.net/v1/people_groups.json";
const PAGE_SIZE = 1000;
const CACHE = path.join(".cache", "joshua-project");
const OUT = path.join("public", "data", "groups.json");
const SAMPLE = path.join("scripts", "data", "groups.sample.json");
const PRIMARY_SHARE = 0.1;

type Row = {
  PeopleID3: number;
  PeopNameAcrossCountries: string;
  PeopNameInCountry: string;
  NaturalName: string | null;
  ISO3: string;
  Ctry: string;
  Latitude: number;
  Longitude: number;
  Population: number | null;
  PrimaryReligion: string | null;
  PrimaryLanguageName: string | null;
  ROL3: string | null;
  PeopleGroupPhotoURL: string | null;
  PhotoAddress: string | null;
  PhotoCreativeCommons: string | null;
  PhotoCCVersionText: string | null;
  PhotoCredits: string | null;
  PhotoCreditURL: string | null;
};

const languages: Record<string, [string | null, string | null]> = JSON.parse(await readFile("scripts/data/languages.json", "utf8"));
const regions: Record<string, { continent: string; region: string }> = JSON.parse(
  await readFile("scripts/data/regions.json", "utf8"),
);

async function fetchRows(apiKey: string | undefined): Promise<Row[] | null> {
  const rows: Row[] = [];
  for (let page = 1; ; page++) {
    const file = path.join(CACHE, `people_groups-${page}.json`);
    let batch: Row[];
    try {
      batch = JSON.parse(await readFile(file, "utf8"));
    } catch {
      if (!apiKey) return null;
      const url = `${API}?${new URLSearchParams({ api_key: apiKey, limit: String(PAGE_SIZE), page: String(page) })}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Joshua Project API page ${page}: HTTP ${res.status}`);
      const text = await res.text();
      batch = JSON.parse(text);
      await mkdir(CACHE, { recursive: true });
      await writeFile(file, text);
    }
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

function displayName(rows: Row[]): string {
  const across = rows[0].PeopNameAcrossCountries.trim();
  const natural = rows[0].NaturalName?.trim();
  if (natural && rows.every((r) => r.PeopNameInCountry === across)) return natural;
  const [head, ...rest] = across.split(", ");
  return rest.length ? `${rest.join(" ").replace(/\bgeneral\b/, "").trim()} ${head}` : across;
}

function photo(row: Row): Group["photo"] {
  const license = row.PhotoCCVersionText?.trim();
  if (row.PhotoCreativeCommons !== "Y" || !license || license.includes("ND") || !row.PhotoAddress || !row.PeopleGroupPhotoURL) return null;
  return {
    url: row.PeopleGroupPhotoURL,
    credit: row.PhotoCredits?.trim() || "Unknown",
    license,
    ...(row.PhotoCreditURL ? { creditUrl: row.PhotoCreditURL } : {}),
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

function toGroup(rows: Row[]): Group {
  rows.sort((a, b) => (b.Population ?? 0) - (a.Population ?? 0));
  const top = rows[0];
  const population = rows.reduce((sum, r) => sum + (r.Population ?? 0), 0);
  const countries: Country[] = rows.map((r) => ({ iso3: r.ISO3, name: r.Ctry, population: r.Population ?? 0 }));
  const name = displayName(rows);
  const aliases = [...new Set(rows.flatMap((r) => [r.PeopNameAcrossCountries, r.PeopNameInCountry, r.NaturalName ?? ""]).map((s) => s.trim()))].filter(
    (s) => s && s !== name,
  );
  const iso = top.ROL3 && top.ROL3 !== "xxx" ? top.ROL3 : null;
  const [languageFamily, languageBranch] = (iso && languages[iso]) || [null, null];
  const place = regions[top.ISO3];
  if (!place) throw new Error(`No region for ${top.ISO3}`);
  return {
    id: String(top.PeopleID3),
    name,
    aliases,
    countries,
    primaryCountries: population ? countries.filter((c) => c.population / population >= PRIMARY_SHARE).map((c) => c.iso3) : [top.ISO3],
    continent: place.continent,
    region: place.region,
    lat: round(top.Latitude),
    lon: round(top.Longitude),
    population,
    religion: top.PrimaryReligion ?? "Unknown",
    language: { name: top.PrimaryLanguageName ?? "Unknown", iso639_3: iso },
    languageFamily,
    languageBranch,
    photo: rows.map(photo).find((p) => p !== null) ?? null,
  };
}

const rows = await fetchRows(process.env.JOSHUA_PROJECT_API_KEY);
if (!rows) {
  await writeFile(OUT, await readFile(SAMPLE));
  console.warn(`JOSHUA_PROJECT_API_KEY is not set and no cache exists: copied ${SAMPLE} to ${OUT}.`);
} else {
  const byId = new Map<number, Row[]>();
  for (const r of rows) byId.set(r.PeopleID3, [...(byId.get(r.PeopleID3) ?? []), r]);
  const groups = [...byId.values()].map(toGroup).sort((a, b) => b.population - a.population);
  const count = (key: (g: Group) => string) => {
    const counts = new Map<string, number>();
    for (const g of groups) counts.set(key(g).toLowerCase(), (counts.get(key(g).toLowerCase()) ?? 0) + 1);
    return (g: Group) => counts.get(key(g).toLowerCase())!;
  };
  const byName = count((g) => g.name);
  const byNameAndCountry = count((g) => `${g.name} (${g.countries[0].name})`);
  for (const g of groups.filter((g) => byName(g) > 1)) {
    const suffix = byNameAndCountry(g) > 1 ? `${g.countries[0].name}, #${g.id}` : g.countries[0].name;
    g.aliases.unshift(g.name);
    g.name = `${g.name} (${suffix})`;
  }
  const json = JSON.stringify(groups);
  await writeFile(OUT, json + "\n");
  const daily: { groupId: string }[] = JSON.parse(await readFile(path.join("public", "data", "daily.json"), "utf8"));
  const dailyIds = new Set(daily.map((d) => d.groupId));
  await writeFile(SAMPLE, JSON.stringify(groups.filter((g) => dailyIds.has(g.id)), null, 1) + "\n");
  console.log(
    `${groups.length} groups from ${rows.length} rows, ${groups.filter((g) => g.photo).length} with a reusable photo, ${(json.length / 1024).toFixed(0)} KiB → ${OUT}`,
  );
}
