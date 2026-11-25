import type { ReactNode } from "react";
import { compass, countryLabel, formatPopulation, type Feedback, type TileState } from "@/lib/game";
import type { Group } from "@/lib/types";
import { ArrowDown, ArrowUp, Check, Cross, Half, Pointer, Target } from "./Icons";
import styles from "./Board.module.css";

export type Row = { group: Group; feedback: Feedback };

const STATE_ICON: Record<TileState, ReactNode> = { match: <Check />, partial: <Half />, miss: <Cross /> };
const STATE_WORD: Record<TileState, string> = { match: "match", partial: "partly", miss: "no match" };

const RELIGION_LABEL: Record<string, string> = {
  Christianity: "Christian",
  Islam: "Muslim",
  Hinduism: "Hindu",
  Buddhism: "Buddhist",
  Judaism: "Jewish",
  "Ethnic Religions": "Ethnic religion",
  "Non-Religious": "Non-religious",
};
export const religionLabel = (religion: string) => RELIGION_LABEL[religion] ?? religion;

const shortRegion = (region: string) => region.replace(/^(Western|Eastern|Southern|Northern)\b/, (w) => `${w[0]}.`);

export const COLUMNS = ["Continent", "Region", "Country", "People", "Family", "Branch", "Faith", "Distance"];

type TileProps = {
  label: string;
  value: string;
  short?: string;
  state: TileState | "neutral" | "distance" | "found";
  icon: ReactNode;
  note?: string;
  spoken: string;
};

export function Tile({ label, value, short, state, icon, note, spoken }: TileProps) {
  return (
    <div className={`${styles.tile} ${styles[state]}`} role="cell" aria-label={`${label}: ${spoken}`}>
      <span className={styles.label} aria-hidden>
        {note ?? label}
      </span>
      <span className={styles.value} aria-hidden>
        {short ? (
          <>
            <span className={styles.long}>{value}</span>
            <span className={styles.short}>{short}</span>
          </>
        ) : (
          value
        )}
      </span>
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
    </div>
  );
}

export function Tiles({ group, feedback: f }: Row) {
  const stateTile = (label: string, value: string | null, state: TileState, short?: string) => (
    <Tile
      key={label}
      label={label}
      value={value ?? "—"}
      short={short}
      state={state}
      icon={STATE_ICON[state]}
      spoken={`${value ?? "unknown"}, ${STATE_WORD[state]}`}
    />
  );
  const popWord = f.population === "match" ? "same" : f.population === "higher" ? "the answer has more" : "the answer has fewer";
  return (
    <>
      {stateTile("Continent", group.continent, f.continent)}
      {stateTile("Region", group.region, f.region, shortRegion(group.region))}
      {stateTile("Country", countryLabel(group), f.country, group.primaryCountries.slice(0, 3).join(" · "))}
      <Tile
        label="People"
        value={formatPopulation(group.population)}
        state={f.population === "match" ? "match" : "neutral"}
        icon={f.population === "match" ? <Check /> : f.population === "higher" ? <ArrowUp /> : <ArrowDown />}
        spoken={`${formatPopulation(group.population)}, ${popWord}`}
      />
      {stateTile("Family", group.languageFamily, f.family)}
      {stateTile("Branch", group.languageBranch, f.branch)}
      {stateTile("Faith", religionLabel(group.religion), f.religion)}
      <Tile
        label="Distance"
        value={f.correct ? "Found it!" : `${f.distanceKm.toLocaleString("en")} km`}
        state={f.correct ? "found" : "distance"}
        note={f.correct ? "100%" : `${f.direction ?? compass(f.bearing)} · ${f.proximity}%`}
        icon={f.correct ? <Target /> : <Pointer style={{ transform: `rotate(${f.bearing}deg)` }} />}
        spoken={f.correct ? "correct" : `${f.distanceKm} kilometres ${f.direction ?? ""}, ${f.proximity}% close`}
      />
    </>
  );
}

type BoardProps = { rows: Row[]; fresh?: boolean; newestFirstOnMobile?: boolean };

export function Board({ rows, fresh, newestFirstOnMobile }: BoardProps) {
  if (rows.length === 0) return null;
  return (
    <div className={`${styles.board} ${newestFirstOnMobile ? styles.reverseMobile : ""}`} role="table" aria-label="Your guesses">
      <div className={styles.head} role="row">
        <span role="columnheader" className={styles.blank}>
          Guess
        </span>
        {COLUMNS.map((c) => (
          <span key={c} role="columnheader">
            {c}
          </span>
        ))}
      </div>
      <div className={styles.rows} role="rowgroup">
        {rows.map((row, i) => {
          const newest = fresh && i === rows.length - 1;
          return (
            <div key={row.group.id} role="row" className={`${styles.row} ${newest ? styles.fresh : ""}`}>
              <div className={styles.name} role="rowheader">
                <span className={styles.groupName}>
                  {row.group.name}
                  {newest && <span className={styles.badge}>New</span>}
                </span>
                <span className={styles.countries}>{countryLabel(row.group, 2)}</span>
              </div>
              <Tiles {...row} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
