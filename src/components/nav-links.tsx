"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links, mobile }: { links: { href: string; label: string }[]; mobile?: boolean }) {
  const pathname = usePathname();
  if (mobile) {
    return (
      <div className="flex items-stretch justify-around">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold ${
                active ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              <span className={`h-1 w-6 rounded-full ${active ? "bg-neutral-900" : "bg-transparent"}`} />
              {l.label}
            </Link>
          );
        })}
      </div>
    );
  }
  return (
    <nav className="space-y-1">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              active ? "bg-white text-neutral-950" : "text-neutral-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
