import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getLocale, getTheme } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "AZ Architects — Enterprise ERP",
  description:
    "Project management, procurement, inventory, client billing and secure document management for AZ Architects.",
};

// Runs before paint: applies the saved theme (cookie → localStorage → OS preference)
// so the page never flashes the wrong mode.
const THEME_INIT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)az-theme=([^;]*)/);var v=(m&&m[1])||localStorage.getItem('az-theme');if(v==='dark'||(!v&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = await getTheme();
  return (
    <html
      lang={locale === "bn" ? "bn" : "en"}
      className={theme === "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Script id="az-theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Providers initialLocale={locale} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
