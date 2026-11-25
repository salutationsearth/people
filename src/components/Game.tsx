"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_GUESSES, compare, dailyEntry, dayIndex, type GroupSummary } from "@/lib/game";
import { hasSeenHowToPlay, loadProgress, loadStats, markHowToPlaySeen, recordResult, saveProgress, type Stats } from "@/lib/storage";
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
  const [animateLast, setAnimateLast] = useState(false);

  const startDay = useCallback(() => {
    const now = new Date();
    setToday(now);
    setGuessIds(loadProgress(dayIndex(now)));
    setStats(loadStats());
    setAnimateLast(false);
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

  const day = today ? dayIndex(today) : null;
  const entry = data && today ? dailyEntry(data.daily, data.byId, today) : null;
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
    setAnimateLast(true);
    saveProgress({ day, guesses: next });
    const correct = group.id === entry.groupId;
    if (correct || next.length >= MAX_GUESSES) setStats(recordResult(day, correct, next.length));
  };

  const closePanel = () => {
    if (panel === "help") markHowToPlaySeen();
    setPanel(null);
  };

  const misses = guessed.filter((id) => id !== entry?.groupId).length;
  const freeClues = answer?.photo ? 0 : 1;
  const guessPoints = guessed.map((id) => data!.byId.get(id)!);
  const unlocked = Math.min(CLUE_COUNT, misses + freeClues);

  return (
    <>
      <Header
        puzzle={day === null || !entry ? null : day + 1}
        date={today}
        onMap={() => setPanel("map")}
        onHelp={() => setPanel("help")}
        onStats={() => setPanel("stats")}
      />
      <main className={styles.main}>
        {error ? (
          <p className={styles.status}>{error}</p>
        ) : !data || !today || !stats ? (
          <p className={styles.status}>Loading today&apos;s people…</p>
        ) : !entry || !target ? (
          <p className={styles.status}>No puzzle today. Check back soon.</p>
        ) : over && !answer ? (
          <p className={styles.status}>Loading today&apos;s answer…</p>
        ) : over && answer ? (
          <EndView
            index={data.index}
            answer={answer}
            entry={entry}
            rows={rows}
            won={won}
            puzzle={day! + 1}
            stats={stats}
            onNewDay={startDay}
          />
        ) : (
          <div className={styles.play}>
            <aside className={styles.left}>
              {answer?.photo && <Portrait photo={answer.photo} badge="Today's portrait" />}
              <div>
                <h1 className={styles.title}>Which people is today&apos;s person part of?</h1>
                <p className={styles.sub}>One person never stands for a whole people. The clues do the real work.</p>
              </div>
              <Clues
                clues={entry.clues}
                unlocked={unlocked}
                freeClues={freeClues}
                title="Clues"
                note={`${unlocked} of ${CLUE_COUNT} · a new one after each miss`}
              />
            </aside>
            <section className={styles.right} aria-label="Guesses">
              <div className={styles.progress}>
                <h2>
                  Guess <strong>{rows.length + 1}</strong> of {MAX_GUESSES}
                </h2>
                <ol className={styles.pips} aria-hidden>
                  {Array.from({ length: MAX_GUESSES }, (_, i) => (
                    <li key={i} className={i < rows.length ? styles.used : i === rows.length ? styles.current : ""} />
                  ))}
                </ol>
              </div>
              <div className={styles.inputSlot}>
                <GuessInput groups={data.index} exclude={exclude} onGuess={guess} />
              </div>
              <div className={styles.boardSlot}>
                {guessed.length > rows.length ? (
                  <p className={styles.status}>Loading your guesses…</p>
                ) : (
                  <Board rows={rows} animateLast={animateLast} newestFirstOnMobile />
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer photo={over ? answer?.photo : null} />

      {panel === "help" && <HowToPlay onClose={closePanel} />}
      {panel === "stats" && stats && (
        <Modal title="Your stats" onClose={closePanel}>
          <StatsNumbers stats={stats} />
          <h3 className={styles.modalH3}>Guess distribution</h3>
          <Distribution stats={stats} highlight={won ? rows.length : undefined} />
        </Modal>
      )}
      {panel === "map" && data && target && (
        <Modal
          title="Map of peoples"
          subtitle="Every dot is a people's homeland. Arrows point toward today's answer."
          variant="side"
          onClose={closePanel}
        >
          <div className={styles.mapWrap}>
            <GameMap groups={data.index} guesses={guessPoints} answer={target} reveal={over} />
            <p className={styles.mapNote}>
              <svg width="32" height="10" viewBox="0 0 32 10" aria-hidden>
                <path d="M1 5h24" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                <path d="M31 5l-8-4.5v9z" fill="var(--accent)" />
              </svg>
              <span>
                <strong>Direction only.</strong> Arrows stay the same length at every zoom.
              </span>
            </p>
          </div>
          <p className={styles.legend}>
            <span className={styles.legendDot} /> People-group homeland · {data.index.length.toLocaleString("en")} groups
            <span className={styles.legendGuess} /> Your guess
            <span>Tap a dot to see its name</span>
          </p>
        </Modal>
      )}
    </>
  );
}
