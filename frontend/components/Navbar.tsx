"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, History, AudioLines } from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Generate", icon: AudioLines },
  { href: "/voices", label: "Voices", icon: Mic2 },
  { href: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <span className="text-brand">⬡</span> Storytelling
        </span>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                path === href
                  ? "bg-surface-card text-white font-medium"
                  : "text-neutral-400 hover:text-white hover:bg-surface-hover"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
