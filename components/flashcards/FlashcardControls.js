"use client";

import { RotateCw, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export default function FlashcardControls({
  hasCard,
  isFlipped,
  deckLength,
  onPrev,
  onNext,
  onFlip,
  onRate,
}) {
  return (
    <div className="pt-2">
      {hasCard && isFlipped ? (
        <div className="w-full bg-white p-3 sm:p-3.5 wobbly-border-sm hard-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3 sm:order-2">
            <button
              type="button"
              onClick={() => onRate("learning")}
              className="py-2.5 sm:py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-red-100 hover:bg-red-200 hard-shadow-sm btn-press font-hand font-bold text-red-900 flex flex-col items-center justify-center cursor-pointer"
            >
              <span className="text-lg sm:text-xl leading-none mb-0.5">✕</span>
              <span className="text-sm sm:text-base flex items-center gap-1">
                Again{" "}
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">
                  1
                </kbd>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRate("learning")}
              className="py-2.5 sm:py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-yellow-200 hover:bg-yellow-300 hard-shadow-sm btn-press font-hand font-bold text-yellow-900 flex flex-col items-center justify-center cursor-pointer"
            >
              <span className="text-lg sm:text-xl leading-none mb-0.5">⚡</span>
              <span className="text-sm sm:text-base flex items-center gap-1">
                Hard{" "}
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">
                  2
                </kbd>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRate("mastered")}
              className="py-2.5 sm:py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-green-200 hover:bg-green-300 hard-shadow-sm btn-press font-hand font-bold text-green-900 flex flex-col items-center justify-center cursor-pointer"
            >
              <span className="text-lg sm:text-xl leading-none mb-0.5">😄</span>
              <span className="text-sm sm:text-base flex items-center gap-1">
                Easy{" "}
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">
                  3
                </kbd>
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:contents">
            <button
              type="button"
              onClick={onNext}
              className="sm:order-1 flex sm:flex-col items-center justify-center gap-1.5 sm:gap-0 px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-slate-600"
              title="Skip without rating"
            >
              <ChevronsRight className="w-5 h-5" />
              <span className="text-sm">Skip</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="sm:order-3 flex items-center justify-center gap-1.5 p-2.5 sm:p-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 font-hand font-bold text-sm"
              title="Next card"
            >
              <span className="sm:hidden">Next</span>
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-white p-3 wobbly-border-sm hard-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onFlip}
            className="sm:order-2 flex-1 sm:max-w-sm py-3 px-5 bg-yellow-400 font-bold font-hand text-lg sm:text-xl wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 btn-press flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-5 h-5 text-[#2d2d2d]" />
            <span>Flip to Reveal Answer</span>
            <kbd className="hidden sm:inline-block text-xs font-mono px-1.5 py-0.5 rounded bg-white border border-[#2d2d2d]">
              Space
            </kbd>
          </button>

          <div className="grid grid-cols-2 gap-2 sm:contents">
            <button
              type="button"
              onClick={onPrev}
              disabled={deckLength <= 1}
              className="sm:order-1 px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-base sm:text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={deckLength <= 1}
              className="sm:order-3 px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-base sm:text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
