"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "peoPLE:theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const current = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (!localStorage.getItem(KEY)) document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    const system: Theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    try {
      if (next === system) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
    document.documentElement.dataset.theme = next;
  };

  return { theme, toggle };
}
