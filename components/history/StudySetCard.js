"use client";

import Link from "next/link";
import {
  Layers,
  BookOpen,
  Calendar,
  FileText,
  FileUp,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function StudySetCard({ set, onDelete }) {
  const cardCount = Array.isArray(set.flashcards) ? set.flashcards.length : 0;
  const quizCount = Array.isArray(set.quiz) ? set.quiz.length : 0;

  const dateStr = set.created_at
    ? new Date(set.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <Card hover className="group relative flex flex-col justify-between h-full p-5 space-y-4">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="accent" size="xs">
            {set.topic || "General"}
          </Badge>
          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            {set.source_type === "pdf" ? (
              <span className="flex items-center gap-1 text-accent-sky">
                <FileUp className="w-3 h-3" /> PDF Source
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notes
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link href={`/study/${set.id}`} className="block">
          <h3 className="text-base font-semibold text-text-primary tracking-tight group-hover:text-accent-sky transition-colors leading-snug">
            {set.title}
          </h3>
        </Link>

        {/* Preview snippet */}
        {set.source_preview && (
          <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed">
            {set.source_preview}
          </p>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="pt-3 border-t border-border-subtle/80 flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-3">
          {cardCount > 0 && (
            <span className="flex items-center gap-1 font-mono">
              <Layers className="w-3.5 h-3.5 text-accent-blue" />
              {cardCount} cards
            </span>
          )}
          {quizCount > 0 && (
            <span className="flex items-center gap-1 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-accent-yellow" />
              {quizCount} qs
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${set.title}"?`)) {
                  onDelete(set.id);
                }
              }}
              className="p-1 rounded text-text-tertiary hover:text-rose-400 transition-colors"
              title="Delete set"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            href={`/study/${set.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent-sky hover:underline"
          >
            Study <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
