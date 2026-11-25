import type { Stats } from "@/lib/storage";
import styles from "./StatsView.module.css";

export function StatsNumbers({ stats }: { stats: Stats }) {
  const solvedIn = stats.distribution.reduce((s, n, i) => s + n * (i + 1), 0);
  const items = [
    { value: stats.played, label: "Played" },
    { value: `${stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%`, label: "Solved" },
    { value: stats.currentStreak, label: "Streak" },
    { value: stats.won ? (solvedIn / stats.won).toFixed(1) : "–", label: "Avg guesses" },
  ];
  return (
    <dl className={styles.numbers}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Distribution({ stats, highlight }: { stats: Stats; highlight?: number }) {
  const max = Math.max(1, ...stats.distribution);
  return (
    <ol className={styles.distribution} aria-label="Guess distribution">
      {stats.distribution.map((n, i) => (
        <li key={i}>
          <span>{i + 1}</span>
          <span className={styles.track}>
            <span className={`${styles.bar} ${highlight === i + 1 ? styles.current : ""}`} style={{ width: `${Math.max(6, (n / max) * 100)}%` }}>
              {n}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
