"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { normalize, search, type GroupSummary } from "@/lib/game";
import { SearchIcon } from "./Icons";
import styles from "./GuessInput.module.css";

const SHOWN = 5;

type Props = { groups: GroupSummary[]; exclude: Set<string>; onGuess: (group: GroupSummary) => void };

function Highlight({ label, query }: { label: string; query: string }) {
  const q = normalize(query);
  const cut = [...label].findIndex((_, i) => normalize(label.slice(0, i + 1)) === q);
  if (cut < 0) return <>{label}</>;
  return (
    <>
      <b>{label.slice(0, cut + 1)}</b>
      {label.slice(cut + 1)}
    </>
  );
}

export function GuessInput({ groups, exclude, onGuess }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const results = useMemo(() => search(groups, query, exclude), [groups, query, exclude]);
  const shown = results.slice(0, SHOWN);
  const expanded = open && shown.length > 0;

  const pick = (group: GroupSummary) => {
    onGuess(group);
    setQuery("");
    setOpen(false);
    setActive(0);
    setError(null);
  };

  const submit = () => {
    const exact = results.find((r) => [r.group.name, ...r.group.aliases].some((n) => normalize(n) === normalize(query)));
    const choice = expanded ? shown[active] : exact;
    if (choice) pick(choice.group);
    else setError(query.trim() ? "Pick a people from the list." : "Type a people, tribe or ethnic group.");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (shown.length) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : shown.length - 1)) % shown.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <form
        className={styles.field}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <SearchIcon className={styles.search} />
        <input
          className={styles.input}
          value={query}
          placeholder="Type a people…"
          role="combobox"
          aria-label="Your guess"
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          aria-activedescendant={expanded ? `${id}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            setError(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className={styles.button}>
          Guess
        </button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {expanded && (
        <div className={styles.popover}>
          <ul id={`${id}-list`} role="listbox" aria-label="Matching peoples" className={styles.list}>
            {shown.map((r, i) => (
              <li
                key={r.group.id}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                className={styles.option}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r.group)}
              >
                <span className={styles.text}>
                  <span className={styles.name}>
                    <Highlight label={r.viaAlias ? r.group.name : r.matched} query={r.viaAlias ? "" : query} />
                    {r.viaAlias && (
                      <span className={styles.alias}>
                        {" "}
                        · <Highlight label={r.matched} query={query} />
                      </span>
                    )}
                  </span>
                  <span className={styles.countries}>
                    {r.group.countries.join(", ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {results.length > SHOWN && <p className={styles.footer}>+{results.length - SHOWN} more</p>}
        </div>
      )}
    </div>
  );
}
