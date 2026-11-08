"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Shuffle,
  Volume2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function FlashcardViewer({
  cards = [],
  progressMap = {},
  onUpdateProgress,
  title = "Flashcard Session",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "learning" | "unseen" | "mastered"
  const [cardOrder, setCardOrder] = useState([]);

  // Initialize or update order when cards or filter change
  useEffect(() => {
    let indices = cards.map((_, i) => i);
    if (filter !== "all") {
      indices = indices.filter((i) => {
        const status = progressMap[i] || "unseen";
        return status === filter;
      });
    }
    setCardOrder(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards, filter, progressMap]);

  const activeIndex = cardOrder[currentIndex];
  const currentCard = activeIndex !== undefined ? cards[activeIndex] : null;
  const currentStatus = activeIndex !== undefined ? progressMap[activeIndex] || "unseen" : "unseen";

  const handleNext = useCallback(() => {
    if (cardOrder.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cardOrder.length);
  }, [cardOrder.length]);

  const handlePrev = useCallback(() => {
    if (cardOrder.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cardOrder.length) % cardOrder.length);
  }, [cardOrder.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleSetStatus = useCallback(
    (status) => {
      if (activeIndex !== undefined && onUpdateProgress) {
        onUpdateProgress(activeIndex, status);
      }
    },
    [activeIndex, onUpdateProgress]
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1") {
        handleSetStatus("learning");
      } else if (e.key === "2") {
        handleSetStatus("mastered");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleSetStatus]);

  // Statistics
  const masteredCount = cards.filter((_, i) => progressMap[i] === "mastered").length;
  const learningCount = cards.filter((_, i) => progressMap[i] === "learning").length;
  const unseenCount = cards.length - masteredCount - learningCount;
  const masteryPercentage = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

  if (!cards || cards.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-text-secondary text-sm">No flashcards available in this study set.</p>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Header & Mastery Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h2>
            <p className="text-xs text-text-tertiary">
              Use <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">Space</kbd> to flip,{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">←</kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">→</kbd> to navigate
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="mastered">{masteredCount} Mastered</Badge>
            <Badge variant="learning">{learningCount} Reviewing</Badge>
            <Badge variant="unseen">{unseenCount} Unseen</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden flex border border-border-subtle/50">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${(masteredCount / cards.length) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${(learningCount / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: "all", label: `All (${cards.length})` },
            { id: "learning", label: `Needs Practice (${learningCount})` },
            { id: "unseen", label: `Unseen (${unseenCount})` },
            { id: "mastered", label: `Mastered (${masteredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filter === tab.id
                  ? "bg-surface-hover text-text-primary font-medium border border-border-translucent"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {cardOrder.length > 0 && (
          <span className="text-xs font-mono text-text-tertiary">
            Card {currentIndex + 1} of {cardOrder.length}
          </span>
        )}
      </div>

      {/* 3D Flip Card */}
      {currentCard ? (
        <div
          onClick={handleFlip}
          className="relative min-h-[280px] sm:min-h-[320px] rounded-2xl cursor-pointer select-none perspective-1000 group"
        >
          <div
            className={`w-full h-full min-h-[280px] sm:min-h-[320px] rounded-2xl border border-border-subtle bg-surface-translucent backdrop-blur-xl p-8 flex flex-col justify-between transition-all duration-300 shadow-glass hover:border-accent-sky/40 relative overflow-hidden ${
              isFlipped ? "border-accent-amber/40 bg-surface/70" : ""
            }`}
          >
            {/* Ambient Corner Glow */}
            <div
              className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity ${
                isFlipped ? "bg-accent-amber/20 opacity-100" : "bg-accent-sky/20 opacity-60"
              }`}
            />

            {/* Top Card Info Bar */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary">
                {isFlipped ? "Answer / Explanation" : "Question / Term"}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    currentStatus === "mastered"
                      ? "mastered"
                      : currentStatus === "learning"
                      ? "learning"
                      : "unseen"
                  }
                  size="xs"
                >
                  {currentStatus.toUpperCase()}
                </Badge>
                <span className="text-text-tertiary text-xs flex items-center gap-1 group-hover:text-text-secondary">
                  <RotateCw className="w-3.5 h-3.5" />
                  Flip
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="my-auto py-6 text-center z-10">
              <p
                className={`text-lg sm:text-xl font-medium tracking-tight text-text-primary leading-relaxed ${
                  isFlipped ? "text-text-primary" : "text-text-primary font-semibold"
                }`}
              >
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </div>

            {/* Bottom status helper */}
            <div className="flex items-center justify-between z-10 text-[11px] text-text-tertiary pt-2 border-t border-border-subtle/50">
              <span>Click card or press Space to reveal {isFlipped ? "prompt" : "answer"}</span>
              <span className="font-mono">Index #{activeIndex + 1}</span>
            </div>
          </div>
        </div>
      ) : (
        <Card className="text-center py-12 space-y-2">
          <p className="text-text-secondary text-sm">No cards match the "{filter}" filter.</p>
          <button
            onClick={() => setFilter("all")}
            className="text-xs text-accent-blue hover:underline"
          >
            Reset to all cards
          </button>
        </Card>
      )}

      {/* Navigation and Mastery Rating Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Previous / Next */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={handlePrev}
            disabled={cardOrder.length <= 1}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-translucent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={cardOrder.length <= 1}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-translucent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status Marking Controls */}
        {currentCard && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                handleSetStatus("learning");
                handleNext();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex-1 sm:flex-initial justify-center"
            >
              <Clock className="w-3.5 h-3.5" />
              Need Practice (1)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSetStatus("mastered");
                handleNext();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex-1 sm:flex-initial justify-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mastered (2)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
