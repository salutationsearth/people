"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_GUESSES, compare, dayIndex, demoPuzzle, puzzleForDay, type GroupSummary } from "@/lib/game";
import {
  applyResult,
  emptyStats,
  hasSeenHowToPlay,
  loadProgress,
  loadStats,
  markHowToPlaySeen,
  recordResult,
  saveProgress,
  type Stats,
} from "@/lib/storage";
import type { DailyEntry, Group } from "@/lib/types";
import { Board, type Row } from "./Board";
import { CLUE_COUNT, Clues } from "./Clues";
import { EndView } from "./EndView";
import { Footer } from "./Footer";
import { GameMap } from "./GameMap";
import { GuessInput } from "./GuessInput";
import { Header } from "./Header";
import { HowToPlay } from "./HowToPlay";
import { Modal } from "./Modal";
import { Portrait } from "./Portrait";
import { Distribution, StatsNumbers } from "./StatsView";
import styles from "./Game.module.css";

type Data = { index: GroupSummary[]; byId: Map<string, GroupSummary>; daily: DailyEntry[] };
type Panel = "map" | "help" | "stats" | null;

export function Game() {
  const [data, setData] = useState<Data | null>(null);
  const [full, setFull] = useState<Map<string, Group> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [guessIds, setGuessIds] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [fresh, setFresh] = useState(false);
  const [demo, setDemo] = useState<string | null>(null);

  const startDay = useCallback(() => {
    const now = new Date();
    const demoParam = new URLSearchParams(location.search).get("day");
    setDemo(demoParam);
    setToday(now);
    setGuessIds(demoParam === null ? loadProgress(dayIndex(now)) : []);
    setStats(demoParam === null ? loadStats() : emptyStats());
    setFresh(false);
  }, []);

  useEffect(() => {
    const fail = () => setError("Could not load today's puzzle.");
    const json = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(url))));
    Promise.all([json("/groups-index.json"), json("/data/daily.json")])
      .then(([index, daily]: [GroupSummary[], DailyEntry[]]) => {
        setData({ index, byId: new Map(index.map((g) => [g.id, g])), daily });
        startDay();
        if (!hasSeenHowToPlay()) setPanel("help");
      })
      .catch(fail);
    json("/data/groups.json")
      .then((groups: Group[]) => setFull(new Map(groups.map((g) => [g.id, g]))))
      .catch(fail);
  }, [startDay]);

  const scheduled = !data || !today ? null : demo === null ? puzzleForDay(data.daily, data.byId, dayIndex(today)) : demoPuzzle(data.daily, data.byId, demo);
  const day = scheduled?.day ?? null;
  const entry = scheduled?.entry ?? null;
  const target = entry && data ? data.byId.get(entry.groupId)! : null;
  const answer = entry && full ? (full.get(entry.groupId) ?? null) : null;
  const guessed = guessIds.filter((id) => data?.byId.has(id));
  const rows: Row[] =
    full && answer
      ? guessed.flatMap((id) => {
          const group = full.get(id);
          return group ? [{ group, feedback: compare(group, answer) }] : [];
        })
      : [];

  const won = !!entry && guessed.includes(entry.groupId);
  const over = won || guessed.length >= MAX_GUESSES;
  const exclude = useMemo(() => new Set(guessIds), [guessIds]);

  const guess = (group: GroupSummary) => {
    if (over || day === null || !entry) return;
    const next = [...guessIds, group.id];
    setGuessIds(next);
    setFresh(true);
    const correct = group.id === entry.groupId;
    const finished = correct || next.length >= MAX_GUESSES;
    if (demo !== null) {
      if (finished) setStats((s) => applyResult(s ?? emptyStats(), day, correct, next.length));
      return;
    }
    saveProgress({ day, guesses: next });
    if (finished) setStats(recordResult(day, correct, next.length));
  };

  const closePanel = () => {
    if (panel === "help") markHowToPlaySeen();
    setPanel(null);
  };

  const misses = guessed.filter((id) => id !== entry?.groupId).length;
  const unlocked = Math.min(CLUE_COUNT, misses + (answer?.photo ? 0 : 1));
  const puzzle = day === null ? 0 : day + 1;
  const number = (
    <>
      No. {puzzle}
      {demo !== null && <span className="demo-tag">demo</span>}
    </>
  );

  return (
    <>
      <Header onMap={() => setPanel("map")} onHelp={() => setPanel("help")} onStats={() => setPanel("stats")} />
      <main className={styles.main}>
        {error ? (
          <p className={styles.status}>{error}</p>
        ) : !data || !today || !stats ? (
          <p className={styles.status}>Loading today&apos;s people…</p>
        ) : !entry || !target ? (
          <p className={styles.status}>{demo === null ? "No puzzle today. Check back soon." : "No puzzle for that day."}</p>
        ) : over && !answer ? (
          <p className={styles.status}>Loading today&apos;s answer…</p>
        ) : over && answer ? (
          <EndView index={data.index} answer={answer} entry={entry} rows={rows} won={won} puzzle={puzzle} demo={demo !== null} stats={stats} onNewDay={startDay} />
        ) : (
          <div className={styles.play}>
            <aside className={styles.left}>
              {answer?.photo ? (
                <Portrait photo={answer.photo} badge={number} />
              ) : (
                <p className={styles.number}>{number}</p>
              )}
              <Clues clues={entry.clues} unlocked={unlocked} />
            </aside>
            <section className={styles.right} aria-label="Guesses">
              <div className={styles.progress}>
                <h1>
                  Guess {guessed.length + 1}
                  <span>/{MAX_GUESSES}</span>
                </h1>
                <ol className={styles.pips} aria-hidden>
                  {Array.from({ length: MAX_GUESSES }, (_, i) => (
                    <li key={i} className={i < guessed.length ? styles.used : i === guessed.length ? styles.current : ""} />
                  ))}
                </ol>
              </div>
              {guessed.length > rows.length ? (
                <p className={styles.status}>Loading your guesses…</p>
              ) : (
                <Board rows={rows} fresh={fresh} newestFirstOnMobile />
              )}
              <div className={styles.inputSlot}>
                <GuessInput groups={data.index} exclude={exclude} onGuess={guess} />
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer photo={answer?.photo} />

      {panel === "help" && <HowToPlay onClose={closePanel} />}
      {panel === "stats" && stats && (
        <Modal title="Stats" onClose={closePanel}>
          <StatsNumbers stats={stats} />
          <Distribution stats={stats} highlight={won ? guessed.length : undefined} />
        </Modal>
      )}
      {panel === "map" && data && target && (
        <Modal title="Map" variant="side" onClose={closePanel}>
          <div className={styles.mapWrap}>
            <GameMap groups={data.index} guesses={guessed.map((id) => data.byId.get(id)!)} answer={target} reveal={over} />
            <p className={styles.mapNote}>
              <svg width="30" height="12" viewBox="0 0 30 12" aria-hidden>
                <path d="M1 6h20" stroke="var(--color-cobalt)" strokeWidth="3" strokeLinecap="round" />
                <path d="M29 6l-9-5v10z" fill="var(--color-cobalt)" />
              </svg>
              Direction only
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
