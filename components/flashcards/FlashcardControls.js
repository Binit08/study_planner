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
        <div className="w-full bg-white p-3.5 wobbly-border-sm hard-shadow flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNext}
            className="flex flex-col items-center justify-center px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-slate-600"
            title="Skip without rating"
          >
            <ChevronsRight className="w-5 h-5" />
            <span className="text-sm">Skip</span>
          </button>

          <div className="flex-1 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onRate("learning")}
              className="py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-red-100 hover:bg-red-200 hard-shadow-sm btn-press font-hand font-bold text-red-900 flex flex-col items-center justify-center cursor-pointer"
            >
              <span className="text-xl leading-none mb-0.5">✕</span>
              <span className="text-base flex items-center gap-1">
                Again <kbd className="text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">1</kbd>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRate("learning")}
              className="py-3 px-2 rounded-xl border-2 border-[#2d2d2d] bg-yellow-200 hover:bg-yellow-300 hard-shadow-sm btn-press font-hand font-bold text-yellow-900 flex flex-col items-center justify-center cursor-pointer"
            >
              <span className="text-xl leading-none mb-0.5">⚡</span>
              <span className="text-base flex items-center gap-1">
                Hard <kbd className="text-[10px] font-mono px-1 rounded bg-white border border-[#2d2d2d]">2</kbd>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRate("mastered")}
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
            onClick={onNext}
            className="p-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600"
            title="Next card"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="w-full bg-white p-3 wobbly-border-sm hard-shadow-sm flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={deckLength <= 1}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            type="button"
            onClick={onFlip}
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
            onClick={onNext}
            disabled={deckLength <= 1}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-hand font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

