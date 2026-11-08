"use client";

import { useGeneration } from "@/hooks/useGeneration";
import GenerationForm from "@/components/generation/GenerationForm";
import GenerationPreview from "@/components/generation/GenerationPreview";
import Card from "@/components/ui/Card";
import { Sparkles, Layers, BookOpen, CheckSquare, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  const {
    data,
    status,
    isLoading,
    error,
    generate,
    refine,
    retry,
    cancel,
    reset,
  } = useGeneration();

  return (
    <div className="space-y-20 pb-16">
      {/* Centered Single-Column Hero Flow (80px+ vertical padding) */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center max-w-3xl mx-auto space-y-6 relative">
        {/* Subtle decorative connection line */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-accent-line to-transparent" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-translucent border border-border-translucent text-xs text-text-secondary backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-sky animate-ping" />
          <span className="font-mono text-accent-sky">Gemini 2.5 Structured Output</span>
          <span className="text-text-tertiary">&bull;</span>
          <span>Zero Hallucinated Chat</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-text-primary leading-[1.1]">
          Turn raw notes into{" "}
          <span className="bg-gradient-to-r from-accent-yellow via-accent-amber to-accent-blue bg-clip-text text-transparent">
            interactive study tools
          </span>
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed font-normal">
          Paste notes, syllabus topics, or upload lecture PDFs. Google Gemini extracts structured
          knowledge graphs, synthesizing them into flashcard decks, auto-graded quizzes, and
          milestone checklists.
        </p>
      </section>

      {/* Main Interactive Flow: Generation Input or Generated Preview */}
      <section className="relative">
        {data ? (
          <GenerationPreview
            data={data}
            onRefine={refine}
            onReset={reset}
            isLoading={isLoading}
          />
        ) : (
          <GenerationForm
            onGenerate={generate}
            onCancel={cancel}
            onRetry={retry}
            isLoading={isLoading}
            error={error}
          />
        )}
      </section>

      {/* Structured Architecture Highlights Grid Cards */}
      {!data && (
        <section className="pt-12 border-t border-border-subtle/60 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Built for reliability, not unpredictable chat
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Strict schema enforcement ensures deterministic UI rendering every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card hover glow className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-text-primary">
                3D Flip Flashcards
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Flip cards with smooth 3D transitions, track unseen vs learning vs mastered
                states, and navigate seamlessly using keyboard shortcuts.
              </p>
            </Card>

            <Card hover glow className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-text-primary">
                Self-Test & Re-test Mistakes
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                4-option multiple-choice quizzes with explanations. Targeted re-testing isolates
                wrong answers so you can drill until you reach 100% mastery.
              </p>
            </Card>

            <Card hover glow className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-text-primary">
                Zod Schema Validation
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Every AI response is independently checked with Zod schemas. Malformed JSON,
                truncated text, and rate limits are caught and handled gracefully without crashes.
              </p>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
