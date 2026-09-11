"use client";
import { Moon, Sun } from "lucide-react";
import { useLocaleCtx, useT, useTheme } from "./providers";
import type { Locale } from "@/lib/i18n/dictionaries";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const t = useT();
  return (
    <button
      type="button"
      onClick={toggle}
      title={t.toggleThemeTitle}
      aria-label={t.toggleThemeTitle}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition hover:bg-white/15 hover:text-white"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function LocaleToggle() {
  const { locale, setLocale } = useLocaleCtx();
  const langs: { key: Locale; label: string }[] = [
    { key: "en", label: "EN" },
    { key: "bn", label: "বাং" },
  ];
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-white/5 p-0.5"
      role="group"
      aria-label="Language / ভাষা"
    >
      {langs.map((l) => (
        <button
          key={l.key}
          type="button"
          onClick={() => setLocale(l.key)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
            locale === l.key ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** Sidebar / login footer cluster: language switch + dark-mode toggle. */
export function PrefsGroup() {
  return (
    <div className="flex items-center gap-2">
      <LocaleToggle />
      <ThemeToggle />
    </div>
  );
}
