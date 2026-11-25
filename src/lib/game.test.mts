import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { demoPuzzle, puzzleForDay } from "./game.ts";
import type { DailyEntry } from "./types";

const daily: DailyEntry[] = JSON.parse(readFileSync("public/data/daily.json", "utf8"));
const ids = new Set(daily.map((e) => e.groupId));

test("?day=N resolves to the puzzle numbered N in the daily schedule", () => {
  for (const n of [1, 2, 329, daily.length + 5]) {
    const demo = demoPuzzle(daily, ids, String(n));
    assert.ok(demo);
    assert.equal(demo.day + 1, n);
    assert.equal(demo.entry, puzzleForDay(daily, ids, n - 1)?.entry);
  }
});

test("?day=<groupId> resolves to that group's daily entry and its puzzle number", () => {
  const akan = demoPuzzle(daily, ids, "10218");
  assert.ok(akan);
  assert.equal(akan.entry.groupId, "10218");
  assert.equal(puzzleForDay(daily, ids, akan.day)?.entry.groupId, "10218");
});

test("?day= rejects values that are neither a puzzle number nor a pool group", () => {
  for (const bad of ["0", "-3", "abc", "", "1.5"]) assert.equal(demoPuzzle(daily, ids, bad), null);
});
