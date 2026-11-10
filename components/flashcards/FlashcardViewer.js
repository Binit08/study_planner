"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Volume2,
  VolumeX,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FormattedContent from "@/components/ui/FormattedContent";

export default function FlashcardViewer({
  cards = [],
  progressMap = {},
  onUpdateProgress,
  onRefineCard,
  title = "Flashcard Session",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "learning" | "unseen" | "mastered"
  const [cardOrder, setCardOrder] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    setShowHint(false);
  }, [cards, filter, progressMap]);

  const activeIndex = cardOrder[currentIndex];
  const currentCard = activeIndex !== undefined ? cards[activeIndex] : null;
  const currentStatus = activeIndex !== undefined ? progressMap[activeIndex] || "unseen" : "unseen";

  // Stop speech when card changes
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (cardOrder.length === 0) return;
    stopSpeech();
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cardOrder.length);
  }, [cardOrder.length, stopSpeech]);

  const handlePrev = useCallback(() => {
    if (cardOrder.length === 0) return;
    stopSpeech();
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cardOrder.length) % cardOrder.length);
  }, [cardOrder.length, stopSpeech]);

  const handleFlip = useCallback(() => {
    stopSpeech();
    setIsFlipped((prev) => !prev);
  }, [stopSpeech]);

  const handleSetStatus = useCallback(
    (status) => {
      if (activeIndex !== undefined && onUpdateProgress) {
        onUpdateProgress(activeIndex, status);
      }
    },
    [activeIndex, onUpdateProgress]
  );

  // Text to Speech
  const handleToggleSpeak = (e) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const textToSpeak = isFlipped ? currentCard?.back : currentCard?.front;
    if (!textToSpeak) return;

    const clean = textToSpeak.replace(/[$*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard navigation support: Space, Left/Right, 1 (Again), 2 (Hard), 3 (Easy)
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        handleSetStatus("learning");
        handleNext();
      } else if (e.key === "3") {
        handleSetStatus("mastered");
        handleNext();
      } else if (e.key.toLowerCase() === "h") {
        setShowHint((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleSetStatus]);

  // Derive an active-recall hint from card back if not explicitly provided
  const getHint = () => {
    if (!currentCard?.back) return null;
    const sentences = currentCard.back.split(/[.?!]\s+/);
    if (sentences.length > 1) {
      return `Key concept: ${sentences[0]}...`;
    }
    const words = currentCard.back.split(" ");
    return `Hint: Relates to ${words.slice(0, 4).join(" ")}...`;
  };

  // Statistics
  const masteredCount = cards.filter((_, i) => progressMap[i] === "mastered").length;
  const learningCount = cards.filter((_, i) => progressMap[i] === "learning").length;
  const unseenCount = cards.length - masteredCount - learningCount;
  const reviewedCount = masteredCount + learningCount;

  if (!cards || cards.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-text-secondary text-sm">No flashcards available in this study set.</p>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-8">
      {/* Top Header & Mastery Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h2>
            <p className="text-xs text-text-tertiary">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">Space</kbd> flip &bull;{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">1</kbd> Again &bull;{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">2</kbd> Hard &bull;{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">3</kbd> Easy
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
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {[
            { id: "all", label: `All (${cards.length})` },
            { id: "learning", label: `Needs Review (${learningCount})` },
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
          className="relative min-h-[250px] sm:min-h-[280px] rounded-2xl cursor-pointer select-none perspective-1000 group"
        >
          <div
            className={`flip-card-inner min-h-[250px] sm:min-h-[280px] ${
              isFlipped ? "flipped" : ""
            }`}
          >
            {/* FRONT FACE (Question / Term) */}
            <div className="flip-card-front w-full min-h-[250px] sm:min-h-[280px] rounded-2xl border border-border-subtle bg-surface-translucent backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between shadow-glass hover:border-accent-sky/40 relative overflow-hidden transition-colors">
              {/* Corner Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-accent-sky/20 opacity-60" />

              {/* Top Bar */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary flex items-center gap-1.5">
                  Question / Term
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSpeak}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      isSpeaking
                        ? "bg-accent-sky/20 border-accent-sky text-accent-sky animate-pulse"
                        : "bg-surface border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-translucent"
                    }`}
                    title={isSpeaking ? "Stop Speaking" : "Read Question Out Loud"}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
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
                </div>
              </div>

              {/* Main Content Area */}
              <div className="my-auto py-4 text-center z-10 flex flex-col items-center justify-center">
                <div className="text-base sm:text-lg font-semibold tracking-tight text-text-primary leading-relaxed max-w-xl">
                  <FormattedContent text={currentCard.front} />
                </div>

                {/* Progressive Disclosure Clue */}
                {showHint && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 animate-fade-in max-w-md text-left"
                  >
                    <span className="font-semibold text-amber-300 mr-1.5">💡 Clue:</span>
                    {getHint()}
                  </div>
                )}
              </div>

              {/* Bottom Controls / Helper */}
              <div className="flex items-center justify-between z-10 text-[11px] text-text-tertiary pt-2 border-t border-border-subtle/50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint((prev) => !prev);
                    }}
                    className="text-text-tertiary hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {showHint ? "Hide Clue" : "Show Clue (H)"}
                  </button>
                </div>
                <span>Click card or Space to reveal</span>
              </div>
            </div>

            {/* BACK FACE (Answer / Explanation) */}
            <div className="flip-card-back w-full min-h-[250px] sm:min-h-[280px] rounded-2xl border border-accent-amber/40 bg-surface/80 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between shadow-glass relative overflow-hidden transition-colors">
              {/* Corner Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-accent-amber/20 opacity-100" />

              {/* Top Bar */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-semibold tracking-wider uppercase text-text-tertiary">
                  Answer & Explanation
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSpeak}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      isSpeaking
                        ? "bg-accent-amber/20 border-accent-amber text-amber-300 animate-pulse"
                        : "bg-surface border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-translucent"
                    }`}
                    title={isSpeaking ? "Stop Speaking" : "Read Answer Out Loud"}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
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
                </div>
              </div>

              {/* Main Content Area */}
              <div className="my-auto py-3 text-center z-10 flex flex-col items-center justify-center">
                <div className="text-sm sm:text-base font-normal text-text-primary leading-relaxed max-w-xl text-left">
                  <FormattedContent text={currentCard.back} />
                </div>
              </div>

              {/* Bottom Info Bar with Per-Card Quick Refine */}
              <div className="flex items-center justify-between z-10 text-[11px] text-text-tertiary pt-2 border-t border-border-subtle/50">
                {onRefineCard ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefineCard(
                          `Add a concrete real-world engineering architecture example (e.g. AWS/Cassandra/Linux) to card: "${currentCard.front}"`
                        );
                      }}
                      className="text-text-tertiary hover:text-accent-sky transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-accent-sky" />
                      Add Example
                    </button>
                  </div>
                ) : (
                  <span>Rate your recall below</span>
                )}
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

      {/* Recall Evaluation & Navigation Controls */}
      <div className="pt-2">
        {currentCard && isFlipped ? (
          /* Anki-style 3-Tier Recall Difficulty Bar (Again / Hard / Easy / Skip) */
          <div className="w-full bg-[#141416]/95 backdrop-blur-xl border border-border-subtle rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-glass animate-fade-in">
            {/* Skip */}
            <button
              type="button"
              onClick={handleNext}
              className="flex flex-col items-center justify-center px-3 py-2 text-text-tertiary hover:text-text-primary transition-all group rounded-xl hover:bg-surface"
              title="Skip without rating"
            >
              <ChevronsRight className="w-4.5 h-4.5 text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[11px] font-medium mt-0.5">Skip</span>
            </button>

            {/* 3 Difficulty Buttons */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              {/* Again (1) */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("learning");
                  handleNext();
                }}
                className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-border-subtle bg-surface/70 hover:bg-rose-500/15 hover:border-rose-500/40 text-text-primary transition-all group active:scale-95 shadow-sm"
              >
                <span className="text-lg font-bold text-red-500 leading-none mb-1 group-hover:scale-110 transition-transform">
                  ✕
                </span>
                <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary flex items-center gap-1">
                  Again
                  <kbd className="hidden sm:inline text-[9px] text-text-tertiary font-mono px-1 rounded bg-black/50 border border-border-subtle">
                    1
                  </kbd>
                </span>
              </button>

              {/* Hard (2) */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("learning");
                  handleNext();
                }}
                className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-border-subtle bg-surface/70 hover:bg-amber-500/15 hover:border-amber-500/40 text-text-primary transition-all group active:scale-95 shadow-sm"
              >
                <span className="text-lg leading-none mb-1 group-hover:scale-110 transition-transform">
                  ⚡
                </span>
                <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary flex items-center gap-1">
                  Hard
                  <kbd className="hidden sm:inline text-[9px] text-text-tertiary font-mono px-1 rounded bg-black/50 border border-border-subtle">
                    2
                  </kbd>
                </span>
              </button>

              {/* Easy / Mastered (3) */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("mastered");
                  handleNext();
                }}
                className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-border-subtle bg-surface/70 hover:bg-emerald-500/15 hover:border-emerald-500/40 text-text-primary transition-all group active:scale-95 shadow-sm"
              >
                <span className="text-lg leading-none mb-1 group-hover:scale-110 transition-transform">
                  😄
                </span>
                <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary flex items-center gap-1">
                  Easy
                  <kbd className="hidden sm:inline text-[9px] text-text-tertiary font-mono px-1 rounded bg-black/50 border border-border-subtle">
                    3
                  </kbd>
                </span>
              </button>
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center px-3 py-3 text-text-tertiary hover:text-text-primary transition-all group rounded-xl hover:bg-surface"
              title="Next card"
            >
              <ChevronsRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          /* Pre-Flip Bar */
          <div className="w-full bg-surface-translucent backdrop-blur-xl border border-border-subtle rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-glass">
            <button
              type="button"
              onClick={handlePrev}
              disabled={cardOrder.length <= 1}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className="flex-1 max-w-sm inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border-translucent text-text-primary hover:bg-surface-hover hover:border-accent-sky/50 transition-all shadow-sm group"
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
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
