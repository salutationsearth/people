import type { ReactNode } from "react";
import type { DailyEntry } from "@/lib/types";
import { Bowl, Cloth, Diamond, Drum, Lock, Speech } from "./Icons";
import styles from "./Clues.module.css";

const CLUES: { key: keyof DailyEntry["clues"]; label: string; icon: ReactNode }[] = [
  { key: "greeting", label: "Greeting", icon: <Speech /> },
  { key: "dress", label: "Dress", icon: <Cloth /> },
  { key: "food", label: "Food", icon: <Bowl /> },
  { key: "music", label: "Festival", icon: <Drum /> },
  { key: "symbols", label: "Symbols", icon: <Diamond /> },
];

export const CLUE_COUNT = CLUES.length;

export function Clues({ clues, unlocked }: { clues: DailyEntry["clues"]; unlocked: number }) {
  const open = CLUES.slice(0, unlocked);
  const locked = CLUES.slice(unlocked);
  return (
    <section className={styles.clues} aria-labelledby="clues-title">
      <h2 id="clues-title" className={styles.title}>
        Clues <span className={styles.count}>{`${unlocked}/${CLUE_COUNT}`}</span>
      </h2>
      <ul className={styles.list}>
        {open.map((clue) => (
          <li key={clue.key} className={styles.item}>
            <span className={styles.icon}>{clue.icon}</span>
            <span className={styles.label}>{clue.label}</span>
            <span className={styles.text}>{clues[clue.key]}</span>
          </li>
        ))}
      </ul>
      {locked.length > 0 && (
        <ul className={styles.locked} aria-label="Locked clues, one unlocks after each miss">
          {locked.map((clue) => (
            <li key={clue.key}>
              <Lock />
              {clue.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
