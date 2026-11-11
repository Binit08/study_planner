"use client";

import { ArrowRight, BrainCircuit, Check } from "lucide-react";

export default function GenerationSidebar({
  isLoading,
  elapsedSeconds,
  loadingStep,
  loadingSteps,
  itemCount,
  sampleTopics,
  onSelectSample,
}) {
  if (isLoading) {
    return (
      <div className="sticky top-8 bg-white p-7 wobbly-border hard-shadow-sm -rotate-1 animate-fade-in space-y-6">
        <div className="flex justify-between items-start">
          <div className="w-14 h-14 border-4 border-slate-800 border-t-yellow-400 rounded-full flex items-center justify-center animate-spin">
            <BrainCircuit className="w-7 h-7 text-[#2d2d2d]" />
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono">
              Elapsed
            </span>
            <p className="text-2xl font-bold font-mono text-yellow-600">{elapsedSeconds}s</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-hand text-[#2d2d2d]">
            Crafting your wisdom...
          </h2>
          <p className="text-base text-slate-600">
            Gemini 2.5 is synthesizing rigorous study materials.
          </p>
        </div>

        <div className="space-y-5 relative">
          <div className="stepper-line" />
          {loadingSteps.map((step, idx) => {
            const isPast = idx < loadingStep;
            const isCurrent = idx === loadingStep;
            return (
              <div key={idx} className="flex items-center gap-3 relative z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    isPast
                      ? "bg-green-400 border-[#2d2d2d] text-[#2d2d2d]"
                      : isCurrent
                      ? "bg-yellow-300 border-[#2d2d2d] text-[#2d2d2d] animate-bounce"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {isPast ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-base font-hand ${
                    isCurrent
                      ? "font-bold text-[#2d2d2d]"
                      : isPast
                      ? "text-slate-600 line-through"
                      : "text-slate-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-yellow-50 rounded-xl border border-dashed border-yellow-300 text-xs italic text-slate-500">
          Tip: Press Space anytime on flashcards to flip them physically in 3D!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm rotate-1">
        <h3 className="text-2xl font-bold font-hand mb-3 text-[#2d2d2d]">
          Expected Output 🎯
        </h3>
        <p className="text-base text-slate-600 leading-relaxed mb-4">
          Google Gemini will synthesize structured knowledge graphs with zero chat hallucination:
        </p>
        <ul className="space-y-2 text-base text-slate-700">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-yellow-200 border border-[#2d2d2d] flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>{itemCount} active-recall 3D flashcards with clues</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-yellow-200 border border-[#2d2d2d] flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>{itemCount} four-option auto-graded questions with explanations</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-yellow-200 border border-[#2d2d2d] flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <span>Progressive milestone checklist with task tracker</span>
          </li>
        </ul>
      </div>

      <div className="space-y-2.5">
        <p className="text-lg font-bold font-hand text-slate-600">
          Or test with a sample sketch:
        </p>
        <div className="space-y-2.5">
          {sampleTopics.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSample(item)}
              className="w-full text-left p-3.5 bg-white wobbly-border-sm hard-shadow-sm hover:bg-yellow-50 transition-all group flex items-center justify-between"
            >
              <div>
                <p className="text-lg font-bold font-hand text-[#2d2d2d] group-hover:text-yellow-700">
                  {item.title}
                </p>
                <p className="text-sm text-slate-500 line-clamp-1">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-yellow-600 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

