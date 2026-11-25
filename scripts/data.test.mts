import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import type { DailyEntry, Group } from "../src/lib/types";

const groupsPath = existsSync("public/data/groups.json") ? "public/data/groups.json" : "scripts/data/groups.sample.json";
const groups: Group[] = JSON.parse(readFileSync(groupsPath, "utf8"));
const daily: DailyEntry[] = JSON.parse(readFileSync("public/data/daily.json", "utf8"));
const byId = new Map(groups.map((g) => [g.id, g]));

const isString = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const isNullableString = (v: unknown) => v === null || isString(v);

test(`${groupsPath} matches the Group contract`, () => {
  assert.ok(groups.length > 0);
  assert.equal(byId.size, groups.length, "group ids are unique");
  assert.equal(new Set(groups.map((g) => g.name.toLowerCase())).size, groups.length, "group names are unique");
  for (const g of groups) {
    const at = `group ${g.id}`;
    assert.deepEqual(
      Object.keys(g).sort(),
      ["aliases", "continent", "countries", "id", "language", "languageBranch", "languageFamily", "lat", "lon", "name", "photo", "population", "primaryCountries", "region", "religion"],
      at,
    );
    assert.match(g.id, /^\d+$/, at);
    for (const key of ["name", "continent", "region", "religion"] as const) assert.ok(isString(g[key]), `${at}.${key}`);
    assert.ok(Array.isArray(g.aliases) && g.aliases.every(isString), `${at}.aliases`);
    assert.ok(g.countries.length > 0, `${at}.countries`);
    for (const c of g.countries) {
      assert.match(c.iso3, /^[A-Z]{3}$/, `${at}.countries.iso3`);
      assert.ok(isString(c.name) && Number.isInteger(c.population) && c.population >= 0, `${at}.countries`);
    }
    for (let i = 1; i < g.countries.length; i++) assert.ok(g.countries[i - 1].population >= g.countries[i].population, `${at}.countries sorted`);
    assert.equal(g.population, g.countries.reduce((sum, c) => sum + c.population, 0), `${at}.population`);
    const isos = new Set(g.countries.map((c) => c.iso3));
    assert.ok(g.primaryCountries.length > 0 && g.primaryCountries.every((iso) => isos.has(iso)), `${at}.primaryCountries`);
    assert.ok(g.lat >= -90 && g.lat <= 90 && g.lon >= -180 && g.lon <= 180, `${at} coordinates`);
    assert.ok(isString(g.language.name), `${at}.language.name`);
    assert.ok(g.language.iso639_3 === null || /^[a-z]{3}$/.test(g.language.iso639_3), `${at}.language.iso639_3`);
    assert.ok(isNullableString(g.languageFamily) && isNullableString(g.languageBranch), `${at} language classification`);
    if (g.photo) {
      assert.match(g.photo.url, /^https:\/\//, `${at}.photo.url`);
      assert.ok(isString(g.photo.credit), `${at}.photo.credit`);
      assert.match(g.photo.license, /^CC/, `${at}.photo.license`);
      assert.doesNotMatch(g.photo.license, /ND/, `${at}.photo.license allows adaptation`);
      assert.ok(g.photo.creditUrl === undefined || /^https?:\/\//.test(g.photo.creditUrl), `${at}.photo.creditUrl`);
    }
  }
});

test("daily.json matches the DailyEntry contract", () => {
  assert.ok(daily.length >= 50, "daily pool has at least 50 entries");
  assert.ok(daily.every((d) => d.facts && d.learnMoreUrl), "every daily entry has facts and a learn-more link");
  assert.equal(new Set(daily.map((d) => d.groupId)).size, daily.length, "daily group ids are unique");
  for (const d of daily) {
    const at = `daily ${d.groupId}`;
    assert.ok(
      Object.keys(d).every((k) => ["blurb", "clues", "facts", "groupId", "learnMoreUrl"].includes(k)),
      `${at} has only contract keys`,
    );
    assert.deepEqual(Object.keys(d.clues).sort(), ["dress", "food", "greeting", "music", "symbols"], at);
    assert.ok(isString(d.blurb) && d.blurb.length <= 500, `${at}.blurb`);
    const sentences = d.blurb.split(/(?<=[.!?])\s+(?=[A-Z])/).length;
    assert.ok(sentences >= 3 && sentences <= 4, `${at}.blurb has 3-4 sentences (${sentences})`);
    for (const [key, clue] of Object.entries(d.clues)) assert.ok(isString(clue) && clue.length <= 120, `${at}.clues.${key}`);
    if (d.facts !== undefined) {
      assert.ok(d.facts.length >= 3 && d.facts.length <= 5, `${at}.facts has 3-5 items`);
      for (const f of d.facts) {
        assert.deepEqual(Object.keys(f).sort(), ["label", "value"], `${at}.facts`);
        assert.ok(isString(f.label) && f.label.length <= 24 && isString(f.value) && f.value.length <= 160, `${at}.facts ${f.label}`);
      }
      assert.equal(new Set(d.facts.map((f) => f.label)).size, d.facts.length, `${at}.facts labels are unique`);
    }
    if (d.learnMoreUrl !== undefined) assert.match(d.learnMoreUrl, /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/, `${at}.learnMoreUrl`);
  }
});

test("every daily answer is a group with a photo and its blurb and clues do not give the name away", () => {
  for (const d of daily) {
    const g = byId.get(d.groupId);
    assert.ok(g, `daily ${d.groupId} exists in ${groupsPath}`);
    assert.ok(g.photo, `daily ${d.groupId} has a reusable photo`);
    const text = [d.blurb, ...Object.values(d.clues)].join(" ").toLowerCase();
    assert.ok(!text.includes(g.name.toLowerCase()), `daily ${d.groupId} does not mention ${g.name}`);
  }
});
