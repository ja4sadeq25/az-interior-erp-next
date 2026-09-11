import { cookies } from "next/headers";
import { dictionaries, type Dict, type Locale, type Theme } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("az-locale")?.value === "bn" ? "bn" : "en";
}

export async function getTheme(): Promise<Theme> {
  const c = await cookies();
  return c.get("az-theme")?.value === "dark" ? "dark" : "light";
}

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()];
}
