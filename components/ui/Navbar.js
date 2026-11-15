"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", id: "generate", label: "Generate" },
  { href: "/planner", id: "planner", label: "Planner" },
  { href: "/flashcards", id: "flashcards", label: "Flashcards" },
  { href: "/quizzes", id: "quizzes", label: "Quizzes" },
  { href: "/history", id: "library", label: "Library" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isItemActive = (item) => {
    if (item.id === "library") {
      return pathname === "/history" || pathname?.startsWith("/study/");
    }
    return pathname === item.href;
  };

  return (
    <nav className="mb-4 md:mb-5 relative select-none">
      <div className="flex justify-between items-center gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 -rotate-1 group transition-transform hover:scale-105"
        >
          <div
            className="w-10 h-10 bg-yellow-300 flex items-center justify-center rotate-3 border-2 border-[#2d2d2d] hard-shadow-sm transition-transform group-hover:rotate-6"
            style={{ borderRadius: "15px 125px 25px 145px / 135px 25px 155px 35px" }}
          >
            <Sparkles className="w-5 h-5 text-[#2d2d2d]" />
          </div>
          <span className="text-3xl font-bold tracking-tight font-hand text-[#2d2d2d]">
            StudyGold
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-5 items-center text-xl font-hand">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            if (item.id === "library") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1 border-2 border-[#2d2d2d] wobbly-border-sm hard-shadow-sm font-bold transition-all hover:bg-yellow-50 hover:translate-x-0.5 hover:translate-y-0.5 ${
                    active ? "bg-yellow-300 text-[#2d2d2d]" : "bg-white text-[#2d2d2d]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-yellow-700 transition-all font-bold pb-0.5 ${
                  active
                    ? "text-yellow-700 border-b-2 border-dashed border-[#2d2d2d]"
                    : "text-[#2d2d2d] border-b-2 border-transparent hover:border-dashed hover:border-[#2d2d2d]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="md:hidden p-2 bg-white wobbly-border-sm hard-shadow-sm text-[#2d2d2d] hover:bg-yellow-50 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden mt-4 bg-white p-4 wobbly-border-sm hard-shadow grid grid-cols-2 gap-2.5 animate-fade-in">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3.5 py-2.5 text-center rounded-xl border-2 font-hand font-bold text-lg transition-all ${
                  active
                    ? "bg-yellow-300 border-[#2d2d2d] text-[#2d2d2d]"
                    : "bg-[#fdfbf7] border-slate-200 text-[#2d2d2d] hover:border-[#2d2d2d]"
                } ${item.id === "library" ? "col-span-2" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
