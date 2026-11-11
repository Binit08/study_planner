"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", id: "generate", label: "Generate" },
    { href: "/planner", id: "planner", label: "Planner" },
    { href: "/flashcards", id: "flashcards", label: "Flashcards" },
    { href: "/quizzes", id: "quizzes", label: "Quizzes" },
    { href: "/history", id: "library", label: "Library" },
  ];

  return (
    <nav className="flex justify-between items-center mb-10 relative select-none">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2 -rotate-1 group transition-transform hover:scale-105">
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

      {/* Navigation Links */}
      <div className="flex flex-wrap gap-3 sm:gap-5 items-center text-base sm:text-xl font-hand">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isLibrary = item.id === "library";

          if (isLibrary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1 bg-white border-2 border-[#2d2d2d] wobbly-border-sm hard-shadow-sm font-bold transition-all hover:bg-yellow-50 hover:translate-x-0.5 hover:translate-y-0.5 ${isActive ? "bg-yellow-200 text-yellow-800" : "text-[#2d2d2d]"
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
              className={`hover:text-yellow-600 transition-all font-bold pb-0.5 ${isActive
                  ? "text-yellow-600 border-b-2 border-dashed border-[#2d2d2d]"
                  : "text-[#2d2d2d] border-b-2 border-transparent hover:border-dashed hover:border-[#2d2d2d]"
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
