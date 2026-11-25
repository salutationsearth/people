"use client";

import { useEffect, useState } from "react";
import { MAX_GUESSES, formatPopulation, shareText, type GroupSummary, type TileState } from "@/lib/game";
import type { Stats } from "@/lib/storage";
import type { DailyEntry, Group } from "@/lib/types";
import { Board, type Row } from "./Board";
import { Clues, CLUE_COUNT } from "./Clues";
import { GameMap } from "./GameMap";
import { Check, Pointer, Share, Target } from "./Icons";
import { Portrait } from "./Portrait";
import { StatsNumbers } from "./StatsView";
import styles from "./EndView.module.css";

type Props = {
  index: GroupSummary[];
  answer: Group;
  entry: DailyEntry;
  rows: Row[];
  won: boolean;
  puzzle: number;
  stats: Stats;
  onNewDay: () => void;
};

function msToMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

function Countdown({ onNewDay }: { onNewDay: () => void }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const left = msToMidnight();
      setMs(left);
      if (left < 1000) onNewDay();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onNewDay]);
  const s = Math.floor((ms ?? 0) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <time className={styles.countdown} suppressHydrationWarning>
      {ms === null ? "--:--:--" : `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`}
    </time>
  );
}

const TONE: Record<TileState, string> = { match: styles.sqMatch, partial: styles.sqPartial, miss: styles.sqMiss };

function ShareCard({ rows, won, puzzle }: { rows: Row[]; won: boolean; puzzle: number }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const text = shareText(puzzle, rows.map((r) => r.feedback), won, location.origin);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <section className={styles.card} aria-labelledby="result-title">
      <header className={styles.cardHead}>
        <h2 id="result-title">Your result</h2>
        <span>
          peoPLE No. {puzzle} · {won ? rows.length : "X"}/{MAX_GUESSES}
        </span>
      </header>
      <ol className={styles.grid} aria-label="Result grid">
        {rows.map(({ feedback: f }, i) => (
          <li key={i}>
            {[f.continent, f.region, f.country].map((s, j) => (
              <span key={j} className={`${styles.sq} ${TONE[s]}`} />
            ))}
            <span className={`${styles.sq} ${f.population === "match" ? styles.sqMatch : styles.sqNeutral}`}>
              {f.population === "higher" ? "↑" : f.population === "lower" ? "↓" : ""}
            </span>
            {[f.family, f.branch, f.religion].map((s, j) => (
              <span key={j} className={`${styles.sq} ${TONE[s]}`} />
            ))}
            <span className={styles.dir}>
              {f.correct ? <Target /> : <Pointer style={{ transform: `rotate(${f.bearing}deg)` }} />}
              {f.proximity}%
            </span>
          </li>
        ))}
      </ol>
      <button className={styles.share} onClick={share}>
        {copied ? <Check /> : <Share />}
        {copied ? "Copied to clipboard" : "Share result"}
      </button>
      <p className={styles.fine}>Shares as emoji squares. No names, so it never spoils the answer.</p>
    </section>
  );
}

export function EndView({ index, answer, entry, rows, won, puzzle, stats, onNewDay }: Props) {
  const countries = answer.primaryCountries.map((iso) => answer.countries.find((c) => c.iso3 === iso)?.name ?? iso);
  const language = [answer.language.name, answer.languageBranch && `${answer.languageBranch} branch`, answer.languageFamily]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className={styles.layout}>
      <aside className={styles.left}>
        {answer.photo && <Portrait photo={answer.photo} badge={answer.name} />}
        <Clues clues={entry.clues} unlocked={CLUE_COUNT} freeClues={0} title="All five clues" note="unlocked at the end" />
        <figure className={styles.mini}>
          <div className={styles.miniMap}>
            <GameMap groups={index} guesses={rows.map((r) => r.group)} answer={answer} reveal interactive={false} />
          </div>
          <figcaption>Your guesses, each pointing toward the {answer.name} homeland</figcaption>
        </figure>
      </aside>

      <section className={styles.center}>
        <p className={`${styles.badge} ${won ? styles.won : styles.lost}`}>
          {won ? <Check /> : null}
          {won ? `Solved in ${rows.length} of ${MAX_GUESSES}` : "So close. Here's who it was"}
        </p>
        <p className={styles.kicker}>Today&apos;s person is part of the</p>
        <h1 className={styles.answer}>{answer.name}</h1>
        <p className={styles.where}>
          {countries.join(" and ")} · {answer.region}
        </p>
        <h2 className={styles.h2}>About the {answer.name}</h2>
        <p className={styles.blurb}>{entry.blurb}</p>
        <p className={styles.links}>
          <a href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(`${answer.name} people`)}`} target="_blank" rel="noreferrer">
            Read more on Wikipedia
          </a>
          {answer.photo?.creditUrl && (
            <a href={answer.photo.creditUrl} target="_blank" rel="noreferrer">
              Photo credit
            </a>
          )}
        </p>
        <dl className={styles.facts}>
          <dt>Language</dt>
          <dd>{language}</dd>
          <dt>Homeland</dt>
          <dd>{answer.countries.slice(0, 5).map((c) => c.name).join(", ")}</dd>
          <dt>Population</dt>
          <dd>About {formatPopulation(answer.population)}</dd>
          <dt>Religion</dt>
          <dd>Mostly {answer.religion}</dd>
        </dl>
      </section>

      <section className={styles.path}>
        <h2 className={styles.h2}>Your path to the answer</h2>
        <Board rows={rows} />
      </section>

      <aside className={styles.right}>
        <ShareCard rows={rows} won={won} puzzle={puzzle} />
        <div className={styles.next}>
          <div>
            <p>Next people in</p>
            <Countdown onNewDay={onNewDay} />
          </div>
          <p className={styles.fine}>New puzzle at midnight, your time</p>
        </div>
        <StatsNumbers stats={stats} />
      </aside>
    </div>
  );
}
