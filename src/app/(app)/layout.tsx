import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { signOut } from "@/app/actions/auth";
import NavLinks from "@/components/nav-links";
import type { Role } from "@/lib/types";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/", label: "Executive Dashboard", roles: ["master", "admin", "project_manager", "site_engineer", "procurement", "finance"] },
  { href: "/projects", label: "Project Management", roles: ["master", "admin", "project_manager", "site_engineer", "procurement", "finance", "client"] },
  { href: "/site", label: "Site Execution Desk", roles: ["master", "admin", "project_manager", "site_engineer"] },
  { href: "/procurement", label: "Procurement & Vendors", roles: ["master", "admin", "procurement", "project_manager", "finance"] },
  { href: "/inventory", label: "Material Inventory", roles: ["master", "admin", "procurement", "project_manager", "site_engineer"] },
  { href: "/billing", label: "Client Billing", roles: ["master", "admin", "finance"] },
  { href: "/documents", label: "Documents DMS", roles: ["master", "admin", "project_manager", "site_engineer", "procurement", "finance"] },
  { href: "/users", label: "Team & Security", roles: ["master"] },
];

const ROLE_LABEL: Record<Role, string> = {
  master: "Master Account",
  admin: "Admin",
  project_manager: "Project Manager",
  site_engineer: "Site Engineer",
  procurement: "Procurement",
  finance: "Finance & Accounts",
  client: "Client Portal",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role === "client") redirect("/projects");
  const links = NAV.filter((n) => n.roles.includes(profile.role));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex items-center justify-between bg-neutral-950 px-4 py-3 text-white md:w-64 md:flex-col md:items-stretch md:justify-start md:py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 font-mono text-sm font-bold">
            AZ
          </span>
          <span>
            <span className="block font-mono text-xs font-bold uppercase tracking-[0.2em]">AZ Architects</span>
            <span className="block text-[10px] text-neutral-400">Enterprise ERP</span>
          </span>
        </Link>
        <div className="hidden md:mt-8 md:block md:flex-1">
          <NavLinks links={links} />
        </div>
        <div className="flex items-center gap-2 md:mt-6 md:flex-col md:items-stretch md:border-t md:border-white/10 md:pt-4">
          <div className="hidden text-sm md:block">
            <div className="font-semibold">{profile.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{ROLE_LABEL[profile.role]}</div>
          </div>
          <form action={signOut}>
            <button className="rounded-lg px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 md:w-full md:text-left">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white md:hidden">
          <NavLinks links={links.slice(0, 5)} mobile />
        </nav>
      </div>
    </div>
  );
}
