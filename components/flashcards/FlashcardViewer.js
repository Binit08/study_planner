"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
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
        handleNext();
      } else if (e.key === "2") {
        handleSetStatus("mastered");
        handleNext();
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
            className={`flip-card-inner min-h-[280px] sm:min-h-[320px] ${
              isFlipped ? "flipped" : ""
            }`}
          >
            {/* FRONT FACE */}
            <div
              className="flip-card-front w-full min-h-[280px] sm:min-h-[320px] rounded-2xl border border-border-subtle bg-surface-translucent backdrop-blur-xl p-8 flex flex-col justify-between shadow-glass hover:border-accent-sky/40 relative overflow-hidden transition-colors"
            >
              {/* Ambient Corner Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-accent-sky/20 opacity-60" />

              {/* Top Card Info Bar */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary">
                  Question / Term
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
                <p className="text-lg sm:text-xl font-semibold tracking-tight text-text-primary leading-relaxed">
                  {currentCard.front}
                </p>
              </div>

              {/* Bottom status helper */}
              <div className="flex items-center justify-between z-10 text-[11px] text-text-tertiary pt-2 border-t border-border-subtle/50">
                <span>Click card or press Space to reveal answer</span>
                <span className="font-mono">Index #{activeIndex + 1}</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className="flip-card-back w-full min-h-[280px] sm:min-h-[320px] rounded-2xl border border-accent-amber/40 bg-surface/70 backdrop-blur-xl p-8 flex flex-col justify-between shadow-glass relative overflow-hidden transition-colors"
            >
              {/* Ambient Corner Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-accent-amber/20 opacity-100" />

              {/* Top Card Info Bar */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary">
                  Answer / Explanation
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
                <p className="text-lg sm:text-xl font-medium tracking-tight text-text-primary leading-relaxed">
                  {currentCard.back}
                </p>
              </div>

              {/* Bottom status helper */}
              <div className="flex items-center justify-between z-10 text-[11px] text-text-tertiary pt-2 border-t border-border-subtle/50">
                <span>Click card or press Space to reveal prompt</span>
                <span className="font-mono">Index #{activeIndex + 1}</span>
              </div>
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
      <div className="pt-2">
        {currentCard && isFlipped ? (
          /* Post-Flip Rating Bar (Forgot / Remembered / Skip) */
          <div className="w-full bg-[#141416]/90 backdrop-blur-xl border border-border-subtle rounded-2xl p-3 flex items-center justify-between gap-3 shadow-glass animate-fade-in">
            {/* Skip Button (Left) */}
            <button
              type="button"
              onClick={handleNext}
              className="flex flex-col items-center justify-center px-4 py-2 text-text-tertiary hover:text-text-primary transition-all group rounded-xl hover:bg-surface min-w-[64px]"
              title="Skip without rating"
            >
              <ChevronsRight className="w-5 h-5 text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-transform" />
              <span className="text-xs font-medium mt-1">Skip</span>
            </button>

            {/* Rating Actions (Center 2 Large Equal Buttons) */}
            <div className="flex-1 grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {/* Forgot Button */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("learning");
                  handleNext();
                }}
                className="flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border border-border-subtle bg-surface/80 hover:bg-rose-500/10 hover:border-rose-500/40 text-text-primary transition-all group active:scale-[0.98] shadow-sm"
              >
                <span className="text-2xl font-bold text-red-500 leading-none mb-1 group-hover:scale-110 transition-transform">
                  ✕
                </span>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary flex items-center gap-1.5">
                  Forgot
                  <kbd className="hidden sm:inline text-[10px] text-text-tertiary font-mono px-1 py-0.2 rounded bg-black/50 border border-border-subtle">
                    1
                  </kbd>
                </span>
              </button>

              {/* Remembered Button */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("mastered");
                  handleNext();
                }}
                className="flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border border-border-subtle bg-surface/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-text-primary transition-all group active:scale-[0.98] shadow-sm"
              >
                <span className="text-2xl leading-none mb-1 group-hover:scale-110 transition-transform">
                  😄
                </span>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary flex items-center gap-1.5">
                  Remembered
                  <kbd className="hidden sm:inline text-[10px] text-text-tertiary font-mono px-1 py-0.2 rounded bg-black/50 border border-border-subtle">
                    2
                  </kbd>
                </span>
              </button>
            </div>

            {/* Fast Forward / Next Button (Right) */}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center px-4 py-4 text-text-tertiary hover:text-text-primary transition-all group rounded-xl hover:bg-surface min-w-[52px]"
              title="Next card"
            >
              <ChevronsRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          /* Pre-Flip Navigation Bar (Before revealing answer) */
          <div className="w-full bg-surface-translucent backdrop-blur-xl border border-border-subtle rounded-2xl p-3 flex items-center justify-between gap-3 shadow-glass">
            <button
              type="button"
              onClick={handlePrev}
              disabled={cardOrder.length <= 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className="flex-1 max-w-sm inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border-translucent text-text-primary hover:bg-surface-hover hover:border-accent-sky/50 transition-all shadow-sm group"
            >
              <RotateCw className="w-4 h-4 text-accent-sky group-hover:rotate-180 transition-transform duration-500" />
              Flip to Reveal Answer
              <kbd className="text-[10px] text-text-tertiary font-mono px-1.5 py-0.5 rounded bg-black/40 border border-border-subtle">
                Space
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={cardOrder.length <= 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

