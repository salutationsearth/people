import type { ReactNode } from "react";
import type { DailyEntry } from "@/lib/types";
import { Bowl, Cloth, Diamond, Drum, Lock, Speech } from "./Icons";
import styles from "./Clues.module.css";

const CLUES: { key: keyof DailyEntry["clues"]; label: string; icon: ReactNode }[] = [
  { key: "greeting", label: "Greeting", icon: <Speech /> },
  { key: "dress", label: "Traditional dress", icon: <Cloth /> },
  { key: "food", label: "Staple food", icon: <Bowl /> },
  { key: "music", label: "Music & festival", icon: <Drum /> },
  { key: "symbols", label: "Symbols", icon: <Diamond /> },
];

export const CLUE_COUNT = CLUES.length;

type Props = { clues: DailyEntry["clues"]; unlocked: number; freeClues: number; title: string; note: string };

export function Clues({ clues, unlocked, freeClues, title, note }: Props) {
  return (
    <section className={styles.clues} aria-labelledby="clues-title">
      <header className={styles.header}>
        <h2 id="clues-title">{title}</h2>
        <span>{note}</span>
      </header>
      <ol className={styles.list}>
        {CLUES.map((clue, i) =>
          i < unlocked ? (
            <li key={clue.key} className={styles.item}>
              <span className={styles.icon}>{clue.icon}</span>
              <div>
                <h3 className={styles.label}>{clue.label}</h3>
                <p>{clues[clue.key]}</p>
              </div>
            </li>
          ) : (
            <li key={clue.key} className={`${styles.item} ${styles.locked}`}>
              <span className={styles.icon}>
                <Lock />
              </span>
              <p>
                {clue.label} · unlocks after guess {i + 1 - freeClues}
              </p>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}
