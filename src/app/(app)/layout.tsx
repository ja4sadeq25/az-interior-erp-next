import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { getDict } from "@/lib/i18n/server";
import { signOut } from "@/app/actions/auth";
import NavLinks from "@/components/nav-links";
import { PrefsGroup } from "@/components/prefs";
import type { Role } from "@/lib/types";

const NAV: { href: string; key: "dashboard" | "projects" | "site" | "procurement" | "inventory" | "billing" | "documents" | "users"; roles: Role[] }[] = [
  { href: "/", key: "dashboard", roles: ["master", "admin", "project_manager", "site_engineer", "procurement", "finance"] },
  { href: "/projects", key: "projects", roles: ["master", "admin", "project_manager", "site_engineer", "procurement", "finance", "client"] },
  { href: "/site", key: "site", roles: ["master", "admin", "project_manager", "site_engineer"] },
  { href: "/procurement", key: "procurement", roles: ["master", "admin", "procurement", "project_manager", "finance"] },
  { href: "/inventory", key: "inventory", roles: ["master", "admin", "procurement", "project_manager", "site_engineer"] },
  { href: "/billing", key: "billing", roles: ["master", "admin", "finance"] },
  { href: "/documents", key: "documents", roles: ["master", "admin", "project_manager", "site_engineer", "procurement", "finance"] },
  { href: "/users", key: "users", roles: ["master"] },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role === "client") redirect("/projects");
  const t = await getDict();
  const links = NAV.filter((n) => n.roles.includes(profile.role)).map((n) => ({
    href: n.href,
    label: t.nav[n.key],
  }));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex items-center justify-between bg-neutral-950 px-4 py-3 text-white md:w-64 md:flex-col md:items-stretch md:justify-start md:py-6 dark:bg-black dark:md:border-r dark:md:border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 font-mono text-sm font-bold">
            AZ
          </span>
          <span>
            <span className="block font-mono text-xs font-bold uppercase tracking-[0.2em]">AZ Architects</span>
            <span className="block text-[10px] text-neutral-400">{t.brandTag}</span>
          </span>
        </Link>
        <div className="hidden md:mt-8 md:block md:flex-1">
          <NavLinks links={links} />
        </div>
        <div className="flex items-center gap-2 md:mt-6 md:flex-col md:items-stretch md:border-t md:border-white/10 md:pt-4">
          <div className="hidden text-sm md:block">
            <div className="font-semibold">{profile.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{t.roles[profile.role]}</div>
          </div>
          <PrefsGroup />
          <form action={signOut}>
            <button className="rounded-lg px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 md:w-full md:text-left">
              {t.signOut}
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white md:hidden dark:border-neutral-800 dark:bg-neutral-950">
          <NavLinks links={links.slice(0, 5)} mobile />
        </nav>
      </div>
    </div>
  );
}
