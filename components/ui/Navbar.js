"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Layers, CheckSquare, History, BookOpen } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Generate", icon: Sparkles },
    { href: "/flashcards", label: "Flashcards", icon: Layers },
    { href: "/quizzes", label: "Quizzes", icon: BookOpen },
    { href: "/history", label: "Library", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle/80 bg-canvas/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border-translucent shadow-sm group-hover:border-accent-sky/50 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent-yellow via-accent-amber to-accent-blue animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-text-primary flex items-center gap-1.5">
              Flam Study
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-accent-blue">
                Gemini
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-surface-hover text-text-primary border border-border-translucent shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-translucent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent-blue" : "text-text-tertiary"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
