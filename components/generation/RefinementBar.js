"use client";

import { useState } from "react";
import { ArrowRight, RefreshCw, Wand2 } from "lucide-react";

export default function RefinementBar({ onRefine, isLoading }) {
  const [prompt, setPrompt] = useState("");

  const suggestions = [
    "Make the quiz questions more challenging",
    "Focus flashcards on formulas and key definitions",
    "Add more practical code/real-world examples",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onRefine(prompt.trim());
    setPrompt("");
  };

  return (
    <div className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-base font-bold font-hand text-[#2d2d2d] flex items-center gap-1.5">
          <Wand2 className="w-4 h-4 text-yellow-600" />
          Refinement Loop
        </label>
        <span className="text-xs font-hand text-slate-500">
          Modify the current study set without starting over
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          placeholder="E.g., 'Make questions harder', 'Add cards on edge cases', 'Simplify explanations'..."
          className="flex-1 rounded-xl bg-[#fdfbf7] border-2 border-[#2d2d2d] px-3 py-2 text-sm text-[#2d2d2d] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 wobbly-border-sm hard-shadow-sm text-base font-bold font-hand bg-yellow-300 text-[#2d2d2d] hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          Refine Set
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-bold font-mono text-slate-500 uppercase">Try:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onRefine(s)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-lg bg-yellow-50 border border-slate-300 text-slate-700 hover:bg-yellow-100 hover:border-[#2d2d2d] transition-all disabled:opacity-50"
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
