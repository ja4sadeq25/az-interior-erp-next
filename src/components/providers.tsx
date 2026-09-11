"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  dictionaries,
  LOCALE_COOKIE,
  THEME_COOKIE,
  type Dict,
  type Locale,
  type Theme,
} from "@/lib/i18n/dictionaries";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
const LocaleCtx = createContext<{ locale: Locale; dict: Dict; setLocale: (l: Locale) => void }>({
  locale: "en",
  dict: dictionaries.en,
  setLocale: () => {},
});

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  try {
    localStorage.setItem(name, value);
  } catch {
    /* private mode */
  }
}

export function Providers({
  initialLocale,
  initialTheme,
  children,
}: {
  initialLocale: Locale;
  initialTheme: Theme;
  children: ReactNode;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      writeCookie(THEME_COOKIE, next);
      return next;
    });
  }, []);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      writeCookie(LOCALE_COOKIE, l);
      router.refresh(); // re-render server components in the new language
    },
    [router]
  );

  // Stay in sync when server props change (e.g. after refresh / navigation).
  useEffect(() => setLocaleState(initialLocale), [initialLocale]);
  useEffect(() => {
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, [initialTheme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <LocaleCtx.Provider value={{ locale, dict: dictionaries[locale], setLocale }}>
        {children}
      </LocaleCtx.Provider>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
export const useLocaleCtx = () => useContext(LocaleCtx);
/** Dictionary for the active language — use inside client components. */
export const useT = () => useContext(LocaleCtx).dict;
