"use client";

import Link from "next/link";
import { Layers, ArrowRight, BookOpen } from "lucide-react";

/**
 * Displays SM-2 due flashcard decks and weak study sets needing review.
 */
export default function ReviewRecommendations({
  dueDecks = [],
  weakSets = [],
  allTasks = [],
  todayStr,
  onPlanWeakSetToday,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Due Flashcards */}
      <section className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-2.5">
          <h3 className="text-xl font-bold font-hand text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-yellow-600" />
            Due Flashcard Reviews
          </h3>
        </div>

        {dueDecks.length === 0 ? (
          <p className="text-base font-hand text-slate-500 py-4">
            All caught up! Study any deck in{" "}
            <Link href="/flashcards" className="text-yellow-700 font-bold underline">
              Flashcards
            </Link>{" "}
            to build your SM-2 review queue.
          </p>
        ) : (
          <div className="space-y-2.5">
            {dueDecks.map((deck) => (
              <div
                key={deck.id}
                className="p-3 rounded-xl border-2 border-slate-200 bg-yellow-50/40 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold font-hand text-slate-900 truncate">{deck.title}</div>
                  <div className="text-xs font-hand text-slate-600">
                    {deck.dueCount} due today &bull; {deck.learningCount} learning
                  </div>
                </div>
                <Link
                  href={`/flashcards?setId=${deck.id}&filter=${
                    deck.dueCount > 0 ? "due" : "learning"
                  }`}
                  className="px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 border border-[#2d2d2d] rounded-lg text-sm font-bold font-hand text-slate-900 flex-shrink-0 inline-flex items-center gap-1"
                >
                  Review <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Weak Areas / Needs Attention */}
      <section className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-2.5">
          <h3 className="text-xl font-bold font-hand text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            Needs Attention
          </h3>
        </div>

        {weakSets.length === 0 ? (
          <p className="text-base font-hand text-slate-500 py-4">
            No weak study sets flagged right now. Keep taking quizzes and rating cards!
          </p>
        ) : (
          <div className="space-y-2.5">
            {weakSets.map((ws) => {
              const alreadyPlannedToday = allTasks.some(
                (t) =>
                  !t.completed &&
                  t.scheduled_date === todayStr &&
                  t.study_set_id === ws.id
              );

              return (
                <div
                  key={ws.id}
                  className="p-3 rounded-xl border-2 border-slate-200 bg-rose-50/40 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/study/${ws.id}`}
                      className="font-bold font-hand text-slate-900 hover:underline block truncate"
                    >
                      {ws.title}
                    </Link>
                    <div className="text-xs font-hand text-rose-700 font-bold">
                      {ws.reasons.join(" • ")}
                    </div>
                  </div>
                  {alreadyPlannedToday ? (
                    <span className="px-3 py-1.5 bg-emerald-100 border border-emerald-600 rounded-lg text-xs font-bold font-hand text-emerald-900 flex-shrink-0">
                      Planned Today ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPlanWeakSetToday(ws)}
                      className="px-3 py-1.5 bg-white hover:bg-yellow-100 border border-[#2d2d2d] rounded-lg text-sm font-bold font-hand text-slate-900 flex-shrink-0"
                    >
                      + Plan Today
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

