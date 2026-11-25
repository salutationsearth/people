"use client";

import { useTheme } from "@/lib/theme";
import { Bars, Help, Logo, MapIcon, Moon, Sun } from "./Icons";
import styles from "./Header.module.css";

type Props = { onMap: () => void; onHelp: () => void; onStats: () => void };

export function Header({ onMap, onHelp, onStats }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo />
        <span className={styles.wordmark}>
          peo<span>PLE</span>
        </span>
      </div>
      <nav className={styles.actions} aria-label="Game">
        <button className={styles.pill} onClick={onMap} aria-label="Map">
          <MapIcon />
          <span>Map</span>
        </button>
        <button onClick={onHelp} aria-label="How to play">
          <Help />
        </button>
        <button onClick={onStats} aria-label="Stats">
          <Bars />
        </button>
        <button onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} suppressHydrationWarning>
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
      </nav>
    </header>
  );
}
