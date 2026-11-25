import type { Feedback } from "@/lib/game";
import type { Group } from "@/lib/types";
import { Tiles } from "./Board";
import { ArrowUp, Check, Cross, Half, Pointer, Speech } from "./Icons";
import { Modal } from "./Modal";
import styles from "./HowToPlay.module.css";

const EXAMPLE: Group = {
  id: "example-ewe",
  name: "Ewe",
  aliases: [],
  countries: [
    { iso3: "GHA", name: "Ghana", population: 3_550_000 },
    { iso3: "TGO", name: "Togo", population: 2_780_000 },
  ],
  primaryCountries: ["GHA", "TGO"],
  continent: "Africa",
  region: "Western Africa",
  lat: 6.6,
  lon: 0.47,
  population: 6_450_000,
  religion: "Christianity",
  language: { name: "Ewe", iso639_3: "ewe" },
  languageFamily: "Atlantic-Congo",
  languageBranch: "Kwa",
  photo: null,
};

const FEEDBACK: Feedback = {
  correct: false,
  continent: "match",
  region: "match",
  country: "partial",
  population: "higher",
  family: "match",
  branch: "match",
  religion: "match",
  distanceKm: 240,
  bearing: 275,
  direction: "W",
  proximity: 98,
};

const KEY = [
  { icon: <Check />, tone: "match", text: "Match" },
  { icon: <Half />, tone: "partial", text: "Shares a country" },
  { icon: <Cross />, tone: "miss", text: "No match" },
  { icon: <ArrowUp />, tone: "neutral", text: "More ↑ / fewer ↓ people" },
  { icon: <Pointer style={{ transform: "rotate(275deg)" }} />, tone: "distance", text: "Distance + direction" },
  { icon: <Speech />, tone: "distance", text: "New clue each miss" },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <p className={styles.lede}>Guess today&apos;s people in 6 tries.</p>
      <section>
        <p className={styles.example}>
          <strong>Ewe</strong> <span>Ghana, Togo</span>
        </p>
        <div className={styles.tiles} role="table" aria-label="Example guess">
          <div role="row" className={styles.tilesRow}>
            <Tiles group={EXAMPLE} feedback={FEEDBACK} />
          </div>
        </div>
      </section>
      <ul className={styles.key}>
        {KEY.map((k) => (
          <li key={k.text}>
            <span className={`${styles.swatch} ${styles[k.tone]}`}>{k.icon}</span>
            {k.text}
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        <svg width="32" height="12" viewBox="0 0 32 12" aria-hidden>
          <path d="M1 6h22" stroke="var(--color-cobalt)" strokeWidth="3" strokeLinecap="round" />
          <path d="M31 6l-9-5v10z" fill="var(--color-cobalt)" />
        </svg>
        Map arrows show direction, never distance.
      </p>
      <button className={styles.start} onClick={onClose}>
        Let&apos;s play
      </button>
    </Modal>
  );
}
