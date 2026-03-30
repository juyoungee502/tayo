"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "tayo-theme";
const CUSTOM_COLOR_KEY = "tayo-custom-brand";
const RANDOM_THEME_STATS_KEY = "tayo-random-theme-stats";

type ThemeMode = "pink" | "blue" | "custom";

type CustomTheme = {
  brand50: string;
  brand100: string;
  brand200: string;
  brand300: string;
  brand400: string;
  brand500: string;
  brand700: string;
  shadow200: string;
  shadow500: string;
  bgSpot1: string;
  bgSpot2: string;
  bgSpot3: string;
  bgBottom: string;
  mesh1: string;
  mesh2: string;
  mesh3: string;
  selection: string;
};

type ThemeStats = Record<string, number>;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function mix(hex: string, target: string, ratio: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const weight = Math.min(Math.max(ratio, 0), 1);

  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * weight),
    Math.round(a.g + (b.g - a.g) * weight),
    Math.round(a.b + (b.b - a.b) * weight),
  );
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildCustomTheme(seed: string): CustomTheme {
  return {
    brand50: mix(seed, "#ffffff", 0.92),
    brand100: mix(seed, "#ffffff", 0.82),
    brand200: mix(seed, "#ffffff", 0.64),
    brand300: mix(seed, "#ffffff", 0.42),
    brand400: mix(seed, "#ffffff", 0.18),
    brand500: seed,
    brand700: mix(seed, "#0f172a", 0.22),
    shadow200: rgba(seed, 0.28),
    shadow500: rgba(seed, 0.22),
    bgSpot1: rgba(seed, 0.2),
    bgSpot2: rgba(mix(seed, "#ffffff", 0.5), 0.2),
    bgSpot3: rgba(mix(seed, "#ffffff", 0.8), 0.55),
    bgBottom: mix(seed, "#ffffff", 0.9),
    mesh1: rgba(seed, 0.24),
    mesh2: rgba(mix(seed, "#ffffff", 0.42), 0.22),
    mesh3: rgba(mix(seed, "#ffffff", 0.82), 0.6),
    selection: rgba(seed, 0.24),
  };
}

function randomHexColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 20);
  const lightness = 45 + Math.floor(Math.random() * 10);
  const color = `hsl(${hue} ${saturation}% ${lightness}%)`;
  const temp = document.createElement("div");
  temp.style.color = color;
  document.body.appendChild(temp);
  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);
  const [r, g, b] = computed.match(/\d+/g)?.map(Number) ?? [2, 123, 206];
  return rgbToHex(r, g, b);
}

function readStats(): ThemeStats {
  try {
    const raw = window.localStorage.getItem(RANDOM_THEME_STATS_KEY);
    return raw ? (JSON.parse(raw) as ThemeStats) : {};
  } catch {
    return {};
  }
}

function writeStats(stats: ThemeStats) {
  window.localStorage.setItem(RANDOM_THEME_STATS_KEY, JSON.stringify(stats));
}

function clearCustomTheme() {
  const root = document.documentElement;
  [
    "--brand-50",
    "--brand-100",
    "--brand-200",
    "--brand-300",
    "--brand-400",
    "--brand-500",
    "--brand-700",
    "--shadow-brand-200-60",
    "--shadow-brand-500-20",
    "--bg-spot-1",
    "--bg-spot-2",
    "--bg-spot-3",
    "--bg-bottom",
    "--mesh-spot-1",
    "--mesh-spot-2",
    "--mesh-spot-3",
    "--selection",
  ].forEach((key) => root.style.removeProperty(key));
}

function applyCustomTheme(theme: CustomTheme) {
  const root = document.documentElement;
  root.style.setProperty("--brand-50", theme.brand50);
  root.style.setProperty("--brand-100", theme.brand100);
  root.style.setProperty("--brand-200", theme.brand200);
  root.style.setProperty("--brand-300", theme.brand300);
  root.style.setProperty("--brand-400", theme.brand400);
  root.style.setProperty("--brand-500", theme.brand500);
  root.style.setProperty("--brand-700", theme.brand700);
  root.style.setProperty("--shadow-brand-200-60", theme.shadow200);
  root.style.setProperty("--shadow-brand-500-20", theme.shadow500);
  root.style.setProperty("--bg-spot-1", theme.bgSpot1);
  root.style.setProperty("--bg-spot-2", theme.bgSpot2);
  root.style.setProperty("--bg-spot-3", theme.bgSpot3);
  root.style.setProperty("--bg-bottom", theme.bgBottom);
  root.style.setProperty("--mesh-spot-1", theme.mesh1);
  root.style.setProperty("--mesh-spot-2", theme.mesh2);
  root.style.setProperty("--mesh-spot-3", theme.mesh3);
  root.style.setProperty("--selection", theme.selection);
}

function applyTheme(mode: ThemeMode, customTheme?: CustomTheme | null) {
  const root = document.documentElement;

  if (mode === "custom" && customTheme) {
    root.dataset.theme = "pink";
    applyCustomTheme(customTheme);
    return;
  }

  clearCustomTheme();
  root.dataset.theme = mode;
}

export function ThemeToggle({ nickname }: { nickname?: string | null }) {
  const [theme, setTheme] = useState<ThemeMode>("pink");
  const [stats, setStats] = useState<ThemeStats>({});
  const ranking = useMemo(
    () => Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 3),
    [stats],
  );

  useEffect(() => {
    const savedMode = window.localStorage.getItem(STORAGE_KEY);
    const savedCustom = window.localStorage.getItem(CUSTOM_COLOR_KEY);
    const parsedCustom = savedCustom ? (JSON.parse(savedCustom) as CustomTheme) : null;
    const nextTheme: ThemeMode = savedMode === "blue" || savedMode === "custom" ? savedMode : "pink";
    setTheme(nextTheme);
    setStats(readStats());
    applyTheme(nextTheme, parsedCustom);
  }, []);

  const handlePresetToggle = () => {
    const nextTheme: ThemeMode = theme === "blue" ? "pink" : "blue";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.localStorage.removeItem(CUSTOM_COLOR_KEY);
    applyTheme(nextTheme);
  };

  const handleRandomTheme = () => {
    const randomSeed = randomHexColor();
    const customTheme = buildCustomTheme(randomSeed);
    const statKey = nickname?.trim() || "익명";
    const nextStats = {
      ...stats,
      [statKey]: (stats[statKey] ?? 0) + 1,
    };

    setTheme("custom");
    setStats(nextStats);
    window.localStorage.setItem(STORAGE_KEY, "custom");
    window.localStorage.setItem(CUSTOM_COLOR_KEY, JSON.stringify(customTheme));
    writeStats(nextStats);
    applyTheme("custom", customTheme);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handlePresetToggle}
          className="rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slateBlue transition hover:bg-brand-50"
        >
          {theme === "blue" ? "핑크로 바꾸기" : "파란색으로 바꾸기"}
        </button>
        <button
          type="button"
          onClick={handleRandomTheme}
          className="rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slateBlue transition hover:bg-brand-50"
        >
          랜덤색상뽑기
        </button>
      </div>

      <div className="w-full max-w-xs rounded-3xl border border-brand-200 bg-white/90 p-3 text-left shadow-lg shadow-brand-200/30 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">쓸데없는 짓하기</p>
        {ranking.length > 0 ? (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {ranking.map(([name, count], index) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50/70 px-3 py-2">
                <p className="truncate font-medium text-slateBlue">{index + 1}등 {name}</p>
                <span className="shrink-0 text-xs font-semibold text-brand-700">{count}회</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">아직 아무도 쓸데없는 짓을 하지 않았어요.</p>
        )}
      </div>
    </div>
  );
}
