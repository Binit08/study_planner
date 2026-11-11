"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  HelpCircle,
  Volume2,
  VolumeX,
  Lightbulb,
  Sparkles,
  Zap,
} from "lucide-react";
import FormattedContent from "@/components/ui/FormattedContent";
import FlashcardControls from "./FlashcardControls";

export default function FlashcardViewer({
  cards = [],
  flashcards = [],
  progressMap = {},
  dueMap = {},
  initialFilter = "all",
  onUpdateProgress,
  onRefineCard,
  title = "Flashcard Session",
}) {
  const deck = cards && cards.length > 0 ? cards : flashcards;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filter, setFilter] = useState(initialFilter); // "all" | "due" | "learning" | "unseen" | "mastered"
  const [cardOrder, setCardOrder] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasRatedInSessionRef = useRef(false);

  useEffect(() => {
    setFilter(initialFilter || "all");
  }, [initialFilter]);

  useEffect(() => {
    hasRatedInSessionRef.current = false;
    let indices = deck.map((_, i) => i);
    if (filter === "due") {
      indices = indices.filter((i) => Boolean(dueMap[i]));
    } else if (filter !== "all") {
      indices = indices.filter((i) => {
        const status = progressMap[i] || "unseen";
        return status === filter;
      });
    }
    setCardOrder(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, filter]);

  // Sync filtered queue when async progressMap/dueMap arrives before user starts rating
  useEffect(() => {
    if (hasRatedInSessionRef.current) return;
    let indices = deck.map((_, i) => i);
    if (filter === "due") {
      indices = indices.filter((i) => Boolean(dueMap[i]));
    } else if (filter !== "all") {
      indices = indices.filter((i) => {
        const status = progressMap[i] || "unseen";
        return status === filter;
      });
    }
    setCardOrder(indices);
    setCurrentIndex(0);
  }, [deck, filter, progressMap, dueMap]);

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
      hasRatedInSessionRef.current = true;
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
  const dueCount = deck.filter((_, i) => Boolean(dueMap[i])).length;

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
            style={{ width: `${deck.length > 0 ? (masteredCount / deck.length) * 100 : 0}%` }}
          />
          <div
            className="h-full bg-yellow-300 transition-all duration-300"
            style={{ width: `${deck.length > 0 ? (learningCount / deck.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#2d2d2d]/30 pb-3 font-hand">
        <div className="flex items-center gap-2 text-base flex-wrap">
          {[
            { id: "all", label: `All (${deck.length})` },
            { id: "due", label: `Due Today (${dueCount})` },
            { id: "learning", label: `Needs Review (${learningCount})` },
            { id: "unseen", label: `Unseen (${unseenCount})` },
            { id: "mastered", label: `Mastered (${masteredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-lg border-2 transition-all font-bold ${filter === tab.id
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
          role="button"
          tabIndex={0}
          aria-pressed={isFlipped}
          aria-label={
            isFlipped
              ? `Flashcard ${currentIndex + 1} of ${cardOrder.length}, answer side. Press Enter or Space to show question.`
              : `Flashcard ${currentIndex + 1} of ${cardOrder.length}, question side. Press Enter or Space to reveal answer.`
          }
          onClick={handleFlip}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleFlip();
            }
          }}
          className="relative min-h-[300px] sm:min-h-[330px] rounded-2xl cursor-pointer select-none perspective-1000 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
        >
          <div
            className={`flip-card-inner min-h-[300px] sm:min-h-[330px] ${isFlipped ? "flipped" : ""
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
                    className={`p-1.5 rounded-lg border-2 border-[#2d2d2d] transition-colors ${isSpeaking ? "bg-yellow-300 animate-pulse" : "bg-white hover:bg-yellow-50"
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
                    className={`p-1.5 rounded-lg border-2 border-[#2d2d2d] transition-colors ${isSpeaking ? "bg-yellow-300 animate-pulse" : "bg-white hover:bg-yellow-50"
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
                <div className="text-base sm:text-lg font-sans font-normal leading-relaxed text-[#2d2d2d] text-left">
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
          <p className="text-xl font-hand text-slate-600">
            No cards match the &ldquo;{filter}&rdquo; filter.
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <FlashcardControls
        hasCard={Boolean(currentCard)}
        isFlipped={isFlipped}
        deckLength={cardOrder.length}
        onPrev={handlePrev}
        onNext={handleNext}
        onFlip={handleFlip}
        onRate={(status) => {
          handleSetStatus(status);
          handleNext();
        }}
      />
    </div>
  );
}
