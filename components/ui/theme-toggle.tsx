"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tayo-theme";

type ThemeMode = "pink" | "blue";

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("pink");
  const isBlue = theme === "blue";

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme: ThemeMode = saved === "blue" ? "blue" : "pink";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const handleToggle = () => {
    const nextTheme: ThemeMode = isBlue ? "pink" : "blue";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slateBlue transition hover:bg-brand-50"
    >
      {isBlue ? "핑크로 바꾸기" : "파란색으로 바꾸기"}
    </button>
  );
}
