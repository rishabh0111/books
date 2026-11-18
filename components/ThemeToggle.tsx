"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const ICON = { system: "monitor", light: "sun", dark: "moon" } as const;
const LABEL = { system: "System", light: "Light", dark: "Dark" };

/** One button that cycles System → Light → Dark. The icon shows the current mode. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const cycle = () => {
    setTheme(next);
    const root = document.documentElement;
    if (next === "system") delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
  };

  const label = `Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}`;
  return (
    <button className="icon-btn theme-btn" onClick={cycle} title={label} aria-label={label}>
      <Icon name={ICON[theme]} size={16} />
    </button>
  );
}
