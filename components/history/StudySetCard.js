"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, FileUp, Trash2, ArrowRight } from "lucide-react";

export default function StudySetCard({ set, onDelete, rotation = "rotate-1" }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const cardCount = Array.isArray(set.flashcards) ? set.flashcards.length : 0;
  const quizCount = Array.isArray(set.quiz) ? set.quiz.length : 0;
  const attemptCount = Array.isArray(set.attempts) ? set.attempts.length : 0;
  const masteredCount = Array.isArray(set.progress)
    ? set.progress.filter((p) => p.status === "mastered").length
    : 0;

  const dateStr = set.created_at
    ? new Date(set.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Recently";

  return (
    <div
      className={`bg-white p-6 wobbly-border-sm hard-shadow-sm card-3d-hover ${rotation} group flex flex-col justify-between h-full relative`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 bg-yellow-100 text-slate-900 font-bold text-xs uppercase wobbly-border-sm">
            {set.topic || "General"}
          </span>
          <span className="text-xs text-slate-400 font-hand">{dateStr}</span>
        </div>

        {/* Source indicator */}
        <div className="mb-4 flex items-center gap-2">
          {set.source_type === "pdf" ? (
            <>
              <FileUp className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] uppercase font-bold text-slate-400">
                Source: PDF Upload
              </span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] uppercase font-bold text-slate-400">
                Source: Text Notes
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <Link href={`/study/${set.id}`} className="block">
          <h3 className="text-2xl font-bold mb-3 font-hand leading-tight text-slate-900 group-hover:text-yellow-700 transition-colors">
            {set.title}
          </h3>
        </Link>

        {/* Preview snippet */}
        {set.source_preview && (
          <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
            {set.source_preview}
          </p>
        )}
      </div>

      {/* Metrics & Actions */}
      <div>
        <div className="flex justify-around py-4 border-y-2 border-dashed border-slate-200 mb-6 text-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-hand text-slate-900">
              {cardCount}
            </span>
            <span className="text-[11px] text-slate-400 uppercase font-bold">
              {masteredCount > 0 ? `${masteredCount} Mastered` : "Cards"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-hand text-slate-900">{quizCount}</span>
            <span className="text-[11px] text-slate-400 uppercase font-bold">Quizzes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-hand text-slate-900">{attemptCount}</span>
            <span className="text-[11px] text-slate-400 uppercase font-bold">Attempts</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/study/${set.id}`}
            className="flex-1 bg-yellow-400 text-center py-2.5 font-bold font-hand text-lg wobbly-border-sm hover:bg-yellow-300 transition-all text-slate-900 flex items-center justify-center gap-2"
          >
            Study Now <ArrowRight className="w-4 h-4" />
          </Link>

          {onDelete &&
            (confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingDelete(false);
                    onDelete(set.id);
                  }}
                  className="px-2.5 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold font-hand hover:bg-rose-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingDelete(false);
                  }}
                  className="px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold font-hand hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                className="p-2.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg"
                title="Delete set"
                aria-label={`Delete ${set.title}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
