"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic2,
  History,
  AudioLines,
  Home,
  Compass,
  CreditCard,
  Users,
  Bell,
  Code,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { clsx } from "clsx";

export default function Navbar() {
  const path = usePathname();

  const mainLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "#", label: "Discovery", icon: Compass, disabled: true },
  ];

  const productLinks = [
    { href: "/", label: "Text To Speech", icon: AudioLines },
    { href: "/voices", label: "Create Voice", icon: Mic2 },
    { href: "/history", label: "Generation History", icon: History },
  ];

  const platformLinks = [
    { href: "#", label: "Billing", icon: CreditCard, disabled: true },
    { href: "#", label: "Team Settings", icon: Users, disabled: true },
    { href: "#", label: "What's New", icon: Bell, disabled: true },
    { href: "#", label: "Developer", icon: Code, disabled: true },
  ];

  return (
    <aside className="w-64 h-full bg-[#101012] border-r border-[#1a1a1f] flex flex-col justify-between p-4 shrink-0 overflow-y-auto select-none">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="font-bold text-base text-white tracking-tight flex items-center gap-2">
            <span className="text-orange-500 font-extrabold text-lg">⬡</span> Storytelling
          </span>
          <span className="text-neutral-600 text-[10px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md font-mono">
            Local
          </span>
        </div>


        {/* Studio Mode Selector */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#161619] border border-[#222227] rounded-xl cursor-pointer hover:bg-[#1d1d22] transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-orange-500" />
            <span className="text-xs font-semibold text-neutral-200">Creative</span>
          </div>
          <ChevronDown size={14} className="text-neutral-500" />
        </div>

        {/* Main Links */}
        <nav className="flex flex-col gap-1">
          {mainLinks.map(({ href, label, icon: Icon, disabled }) => (
            <Link
              key={label}
              href={disabled ? "#" : href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                disabled
                  ? "text-neutral-600 cursor-not-allowed opacity-50"
                  : path === href
                  ? "bg-[#1d1d22] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-[#161619]"
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Products Links */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 mb-1">
            Products
          </span>
          {productLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                path === href
                  ? "bg-[#1d1d22] text-white border border-[#2d2d35]"
                  : "text-neutral-400 hover:text-white hover:bg-[#161619]"
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        {/* Platform Links */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 mb-1">
            Platform
          </span>
          {platformLinks.map(({ href, label, icon: Icon, disabled }) => (
            <Link
              key={label}
              href={disabled ? "#" : href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                disabled
                  ? "text-neutral-600 cursor-not-allowed opacity-60"
                  : "text-neutral-400 hover:text-white hover:bg-[#161619]"
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Upgrade Banner Button */}
      <div className="mt-6">
        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-black bg-gradient-to-r from-amber-200 via-orange-100 to-amber-100 hover:opacity-90 transition-opacity active:scale-[0.98] shadow-md shadow-orange-950/20"
        >
          UPGRADE NOW
        </button>
      </div>
    </aside>
  );
}

