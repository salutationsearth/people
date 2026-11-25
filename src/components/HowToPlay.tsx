import type { Feedback } from "@/lib/game";
import type { Group } from "@/lib/types";
import { Tiles } from "./Board";
import { ArrowUp, Check, Cross, Half, MapIcon, Pointer, Speech } from "./Icons";
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
  { icon: <Check />, tone: "match", title: "Match", text: "Same as the answer" },
  { icon: <Half />, tone: "partial", title: "Partly", text: "Shares at least one main country" },
  { icon: <Cross />, tone: "miss", title: "No match", text: "Different from the answer" },
  { icon: <ArrowUp />, tone: "neutral", title: "Population", text: "The answer has more (↑) or fewer (↓) people" },
  { icon: <Pointer style={{ transform: "rotate(275deg)" }} />, tone: "distance", title: "Distance", text: "Kilometres and compass direction from your guess's homeland to the answer's, plus how close you are as a %" },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <p className={styles.lede}>
        Find today&apos;s people in 6 guesses. Type any people, tribe or ethnic group and pick it from the list. Every guess is compared with the
        answer.
      </p>
      <section>
        <p className={styles.example}>
          <span className={styles.kicker}>Example</span> <strong>Ewe</strong> <span>Ghana, Togo</span>
        </p>
        <div className={styles.tiles} role="table" aria-label="Example guess">
          <div role="row" className={styles.tilesRow}>
            <Tiles group={EXAMPLE} feedback={FEEDBACK} />
          </div>
        </div>
      </section>
      <ul className={styles.key}>
        {KEY.map((k) => (
          <li key={k.title}>
            <span className={`${styles.swatch} ${styles[k.tone]}`}>{k.icon}</span>
            <div>
              <strong>{k.title}</strong>
              <p>{k.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <ul className={`${styles.key} ${styles.more}`}>
        <li>
          <span className={`${styles.swatch} ${styles.distance}`}>
            <Speech />
          </span>
          <div>
            <strong>A clue after every miss</strong>
            <p>A greeting, traditional dress, a staple food, music or a festival, then symbols.</p>
          </div>
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.distance}`}>
            <MapIcon />
          </span>
          <div>
            <strong>Arrows on the map</strong>
            <p>They point toward the answer but never change length, so they show direction, not distance.</p>
          </div>
        </li>
      </ul>
      <footer className={styles.footer}>
        <p>One person never stands for a whole people, and group names follow what members call themselves where we can.</p>
        <button className={styles.start} onClick={onClose}>
          Start guessing
        </button>
      </footer>
    </Modal>
  );
}
