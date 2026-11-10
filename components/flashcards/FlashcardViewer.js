"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  HelpCircle,
  Volume2,
  VolumeX,
  Lightbulb,
  Sparkles,
  Zap,
} from "lucide-react";
import FormattedContent from "@/components/ui/FormattedContent";

export default function FlashcardViewer({
  cards = [],
  flashcards = [],
  progressMap = {},
  onUpdateProgress,
  onRefineCard,
  title = "Flashcard Session",
}) {
  const deck = cards && cards.length > 0 ? cards : flashcards;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "learning" | "unseen" | "mastered"
  const [cardOrder, setCardOrder] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let indices = deck.map((_, i) => i);
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
  }, [deck, filter, progressMap]);

  const activeIndex = cardOrder[currentIndex];
  const currentCard = activeIndex !== undefined ? deck[activeIndex] : null;
  const currentStatus = activeIndex !== undefined ? progressMap[activeIndex] || "unseen" : "unseen";

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

  const getHint = () => {
    if (!currentCard?.back) return null;
    const sentences = currentCard.back.split(/[.?!]\s+/);
    if (sentences.length > 1) {
      return `Key concept: ${sentences[0]}...`;
    }
    const words = currentCard.back.split(" ");
    return `Hint: Relates to ${words.slice(0, 4).join(" ")}...`;
  };

  const masteredCount = deck.filter((_, i) => progressMap[i] === "mastered").length;
  const learningCount = deck.filter((_, i) => progressMap[i] === "learning").length;
  const unseenCount = deck.length - masteredCount - learningCount;

  if (!deck || deck.length === 0) {
    return (
      <div className="bg-white p-8 wobbly-border-sm hard-shadow-sm text-center">
        <p className="text-xl font-hand text-slate-600">No flashcards in this set.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-6">
      {/* Top Header & Mastery Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold font-hand text-[#2d2d2d]">{title}</h2>
            <p className="text-base text-slate-500 font-hand">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#2d2d2d] text-xs font-mono font-bold">Space</kbd> flip &bull;{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#2d2d2d] text-xs font-mono font-bold">1</kbd> Again &bull;{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#2d2d2d] text-xs font-mono font-bold">2</kbd> Hard &bull;{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#2d2d2d] text-xs font-mono font-bold">3</kbd> Easy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 border border-green-600 text-green-800 text-sm font-bold rounded-lg">
              {masteredCount} Mastered
            </span>
            <span className="px-3 py-1 bg-yellow-100 border border-yellow-600 text-yellow-800 text-sm font-bold rounded-lg">
              {learningCount} Reviewing
            </span>
            <span className="px-3 py-1 bg-slate-100 border border-slate-400 text-slate-700 text-sm font-bold rounded-lg">
              {unseenCount} Unseen
            </span>
          </div>
        </div>

        {/* Paper Progress Bar */}
        <div className="w-full h-3 bg-white rounded-full overflow-hidden flex border-2 border-[#2d2d2d] hard-shadow-sm">
          <div
            className="h-full bg-green-400 transition-all duration-300"
            style={{ width: `${(masteredCount / cards.length) * 100}%` }}
          />
          <div
            className="h-full bg-yellow-300 transition-all duration-300"
            style={{ width: `${(learningCount / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#2d2d2d]/30 pb-3 font-hand">
        <div className="flex items-center gap-2 text-base flex-wrap">
          {[
            { id: "all", label: `All (${cards.length})` },
            { id: "learning", label: `Needs Review (${learningCount})` },
            { id: "unseen", label: `Unseen (${unseenCount})` },
            { id: "mastered", label: `Mastered (${masteredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-lg border-2 transition-all font-bold ${
                filter === tab.id
                  ? "border-[#2d2d2d] bg-yellow-300 hard-shadow-sm"
                  : "border-transparent bg-white hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {cardOrder.length > 0 && (
          <span className="text-lg font-bold font-mono text-slate-600">
            Card {currentIndex + 1} of {cardOrder.length}
          </span>
        )}
      </div>

      {/* 3D Flip Card */}
      {currentCard ? (
        <div
          onClick={handleFlip}
          className="relative min-h-[300px] sm:min-h-[330px] rounded-2xl cursor-pointer select-none perspective-1000"
        >
          <div
            className={`flip-card-inner min-h-[300px] sm:min-h-[330px] ${
              isFlipped ? "flipped" : ""
            }`}
          >
            {/* FRONT FACE (White Paper Card with wobbly border) */}
            <div className="flip-card-front w-full min-h-[300px] sm:min-h-[330px] bg-white p-6 sm:p-8 wobbly-border-sm hard-shadow flex flex-col justify-between items-center rotate-1 relative transition-colors">
              {/* Top Bar */}
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold font-mono bg-yellow-100 border border-[#2d2d2d] px-2.5 py-0.5 rounded uppercase">
                  Card #{activeIndex + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSpeak}
                    className={`p-1.5 rounded-lg border-2 border-[#2d2d2d] transition-colors ${
                      isSpeaking ? "bg-yellow-300 animate-pulse" : "bg-white hover:bg-yellow-50"
                    }`}
                    title="Read out loud"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                    {currentStatus}
                  </span>
                </div>
              </div>

              {/* Center Question */}
              <div className="my-auto py-4 text-center flex flex-col items-center justify-center max-w-xl">
                <HelpCircle className="w-10 h-10 text-yellow-500 mb-3" />
                <div className="text-2xl sm:text-3xl font-bold font-hand text-[#2d2d2d] leading-snug">
                  <FormattedContent text={currentCard.front} />
                </div>

                {showHint && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 p-3 bg-yellow-100/80 border-2 border-dashed border-yellow-500 rounded-xl text-base text-yellow-900 font-hand text-left animate-fade-in"
                  >
                    <span className="font-bold mr-1">💡 Clue:</span>
                    {getHint()}
                  </div>
                )}
              </div>

              {/* Bottom Helpers */}
              <div className="w-full flex items-center justify-between text-base font-hand text-slate-500 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint((prev) => !prev);
                  }}
                  className="hover:text-yellow-700 flex items-center gap-1 font-bold"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  {showHint ? "Hide Clue" : "Show Clue (H)"}
                </button>
                <span className="italic">Click card or Space to reveal</span>
              </div>
            </div>

            {/* BACK FACE (Yellow Tint Paper Card) */}
            <div className="flip-card-back w-full min-h-[300px] sm:min-h-[330px] bg-yellow-50 p-6 sm:p-8 wobbly-border-sm hard-shadow flex flex-col justify-between items-center rotate-1 relative transition-colors">
              {/* Top Bar */}
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold font-mono bg-yellow-200 border border-[#2d2d2d] px-2.5 py-0.5 rounded uppercase">
                  Answer & Explanation
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSpeak}
                    className={`p-1.5 rounded-lg border-2 border-[#2d2d2d] transition-colors ${
                      isSpeaking ? "bg-yellow-300 animate-pulse" : "bg-white hover:bg-yellow-50"
                    }`}
                    title="Read out loud"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-bold font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                    {currentStatus}
                  </span>
                </div>
              </div>

              {/* Center Answer */}
              <div className="my-auto py-3 text-center flex flex-col items-center justify-center max-w-xl">
                <Zap className="w-10 h-10 text-yellow-500 mb-2" />
                <div className="text-lg sm:text-xl font-normal leading-relaxed text-[#2d2d2d] text-left">
                  <FormattedContent text={currentCard.back} />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="w-full flex items-center justify-between text-base font-hand text-slate-500 pt-2 border-t border-yellow-200">
                {onRefineCard ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefineCard(
                        `Add a concrete real-world engineering architecture example to card: "${currentCard.front}"`
                      );
                    }}
                    className="text-yellow-800 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    Add Example
                  </button>
                ) : (
                  <span>Rate your recall below</span>
                )}
                <span className="font-mono text-sm font-bold">Index #{activeIndex + 1}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 wobbly-border-sm hard-shadow-sm text-center">
          <p className="text-xl font-hand text-slate-600">No cards match the "{filter}" filter.</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="pt-2">
        {currentCard && isFlipped ? (
          /* Post-Flip Rating Bar (Anki Style) */
          <div className="w-full bg-white p-3.5 wobbly-border-sm hard-shadow flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleNext}
              className="flex flex-col items-center justify-center px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-slate-600"
              title="Skip without rating"
            >
              <ChevronsRight className="w-5 h-5" />
              <span className="text-sm">Skip</span>
            </button>

            <div className="flex-1 grid grid-cols-3 gap-3">
              {/* Again (1) */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("learning");
                  handleNext();
                }}
                className="py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-red-100 hover:bg-red-200 hard-shadow-sm btn-press font-hand font-bold text-red-900 flex flex-col items-center justify-center cursor-pointer"
              >
                <span className="text-xl leading-none mb-0.5">✕</span>
                <span className="text-base flex items-center gap-1">
                  Again <kbd className="text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">1</kbd>
                </span>
              </button>

              {/* Hard (2) */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("learning");
                  handleNext();
                }}
                className="py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-yellow-200 hover:bg-yellow-300 hard-shadow-sm btn-press font-hand font-bold text-yellow-900 flex flex-col items-center justify-center cursor-pointer"
              >
                <span className="text-xl leading-none mb-0.5">⚡</span>
                <span className="text-base flex items-center gap-1">
                  Hard <kbd className="text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">2</kbd>
                </span>
              </button>

              {/* Easy (3) */}
              <button
                type="button"
                onClick={() => {
                  handleSetStatus("mastered");
                  handleNext();
                }}
                className="py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-green-200 hover:bg-green-300 hard-shadow-sm btn-press font-hand font-bold text-green-900 flex flex-col items-center justify-center cursor-pointer"
              >
                <span className="text-xl leading-none mb-0.5">😄</span>
                <span className="text-base flex items-center gap-1">
                  Easy <kbd className="text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">3</kbd>
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="p-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600"
              title="Next card"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Pre-Flip Bar */
          <div className="w-full bg-white p-3 wobbly-border-sm hard-shadow-sm flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={cardOrder.length <= 1}
              className="px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleFlip}
              className="flex-1 max-w-sm py-3 px-6 bg-yellow-400 font-bold font-hand text-xl wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 btn-press flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-5 h-5 text-[#2d2d2d]" />
              <span>Flip to Reveal Answer</span>
              <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-white border border-[#2d2d2d]">
                Space
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={cardOrder.length <= 1}
              className="px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
