"use client";

import { useEffect, useState } from "react";
import { MAX_GUESSES, formatPopulation, shareText, type GroupSummary, type TileState } from "@/lib/game";
import type { Stats } from "@/lib/storage";
import type { DailyEntry, Group } from "@/lib/types";
import { Board, religionLabel, type Row } from "./Board";
import { GameMap } from "./GameMap";
import { Check, Cross, Pointer, Share } from "./Icons";
import { Portrait } from "./Portrait";
import styles from "./EndView.module.css";

type Props = {
  index: GroupSummary[];
  answer: Group;
  entry: DailyEntry;
  rows: Row[];
  won: boolean;
  puzzle: number;
  demo: boolean;
  stats: Stats;
  onNewDay: () => void;
};

function msToMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
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
    <time className={styles.countdown}>
      {ms === null ? "--:--:--" : `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`}
    </time>
  );
}

const TONE: Record<TileState, string> = { match: styles.sqMatch, partial: styles.sqPartial, miss: styles.sqMiss };

function ShareCard({ rows, won, puzzle, demo }: { rows: Row[]; won: boolean; puzzle: number; demo: boolean }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    await navigator.clipboard.writeText(shareText(puzzle, rows.map((r) => r.feedback), won, location.origin));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <section className={styles.card} aria-label="Your result">
      <header className={styles.cardHead}>
        <h2>
          peoPLE #{puzzle}
          {demo && <span className="demo-tag">demo</span>}
        </h2>
        <span>
          {won ? rows.length : "X"}/{MAX_GUESSES}
        </span>
      </header>
      <ol className={styles.grid} aria-label="Result grid">
        {rows.map(({ feedback: f }, i) => (
          <li key={i}>
            {[f.continent, f.region, f.country].map((s, j) => (
              <span key={j} className={`${styles.sq} ${TONE[s]}`} />
            ))}
            <span className={`${styles.sq} ${f.population === "match" ? styles.sqMatch : styles.sqMiss}`}>
              {f.population === "higher" ? "↑" : f.population === "lower" ? "↓" : ""}
            </span>
            {[f.family, f.branch, f.religion].map((s, j) => (
              <span key={j} className={`${styles.sq} ${TONE[s]}`} />
            ))}
            <span className={styles.dir}>
              {f.correct ? <span className={styles.dot} /> : <Pointer style={{ transform: `rotate(${f.bearing}deg)` }} />}
              {f.proximity}%
            </span>
          </li>
        ))}
      </ol>
      <button className={styles.share} onClick={share}>
        {copied ? <Check /> : <Share />}
        {copied ? "Copied" : "Share"}
      </button>
    </section>
  );
}

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 90}%`,
  rotate: `${(i * 71) % 360}deg`,
  color: ["var(--color-cobalt)", "var(--color-partial)", "var(--color-match)"][i % 3],
  shape: i % 4,
  delay: `${(i % 6) * 70}ms`,
}));

export function EndView({ index, answer, entry, rows, won, puzzle, demo, stats, onNewDay }: Props) {
  const countries = answer.primaryCountries.map((iso) => answer.countries.find((c) => c.iso3 === iso)?.name ?? iso);
  const language = [answer.languageBranch, answer.languageFamily].filter(Boolean).join(" · ") || answer.language.name;
  const learnMore =
    entry.learnMoreUrl ?? `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(`${answer.name} people`)}`;

  return (
    <div className={styles.layout}>
      <section className={styles.hero}>
        {won && (
          <div className={styles.confetti} aria-hidden>
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className={styles[`piece${c.shape}`]}
                style={{ left: c.left, top: c.top, rotate: c.rotate, color: c.color, animationDelay: c.delay }}
              />
            ))}
          </div>
        )}
        <p className={`${styles.badge} ${won ? styles.won : styles.lost}`}>
          {won ? <Check /> : <Cross />}
          {won ? "Nailed it" : "So close"} · {won ? rows.length : "X"}/{MAX_GUESSES}
        </p>
        <p className={styles.kicker}>{won ? "It was the" : "Today's people:"}</p>
        <h1 className={styles.answer}>{answer.name}</h1>
        <p className={styles.where}>{countries.join(" · ")}</p>
        <ul className={styles.chips}>
          <li>{language}</li>
          <li>~{formatPopulation(answer.population)} people</li>
          <li>{religionLabel(answer.religion)}</li>
        </ul>
      </section>

      <aside className={styles.side}>
        <ShareCard rows={rows} won={won} puzzle={puzzle} demo={demo} />
        <div className={styles.next}>
          <div>
            <p>Next people in</p>
            <Countdown onNewDay={onNewDay} />
          </div>
          <span className={won ? styles.streak : styles.reset}>
            {won ? `${stats.currentStreak}-day streak` : "Streak reset"}
          </span>
        </div>
      </aside>

      <section className={styles.meet} aria-labelledby="meet-title">
        <h2 id="meet-title" className={styles.h2}>
          Meet the {answer.name}
        </h2>
        <p className={styles.blurb}>{entry.blurb}</p>
        {entry.facts && entry.facts.length > 0 && (
          <dl className={styles.facts}>
            {entry.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <a className={styles.learn} href={learnMore} target="_blank" rel="noreferrer">
          Learn more →
        </a>
      </section>

      <aside className={styles.media}>
        {answer.photo && <Portrait photo={answer.photo} badge={countries[0] ?? answer.name} />}
        <figure>
          <div className={styles.miniMap}>
            <GameMap groups={index} guesses={rows.map((r) => r.group)} answer={answer} reveal interactive={false} />
          </div>
          <figcaption>{won ? `Your ${rows.length} guesses` : `All ${rows.length} guesses`}</figcaption>
        </figure>
      </aside>

      <section className={styles.path}>
        <h2 className={styles.h2}>Your guesses</h2>
        <Board rows={rows} />
      </section>
    </div>
  );
}
