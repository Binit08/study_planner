"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, Wand2 } from "lucide-react";
import Card from "@/components/ui/Card";

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
    <Card className="border-accent-sky/20 bg-surface/40 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-accent-sky" />
          Refinement Loop
        </label>
        <span className="text-[11px] text-text-tertiary">
          Modify the current study set without starting over
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          placeholder="E.g., 'Make questions harder', 'Add cards on edge cases', 'Simplify explanations'..."
          className="flex-1 rounded-lg bg-canvas border border-border-subtle px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-sky/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-sky text-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
          Refine Set
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[10px] text-text-tertiary uppercase">Try:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onRefine(s)}
            disabled={isLoading}
            className="text-[11px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-translucent transition-all disabled:opacity-50"
          >
            "{s}"
          </button>
        ))}
      </div>
    </Card>
  );
}
