"use client";

import { useGeneration } from "@/hooks/useGeneration";
import GenerationForm from "@/components/generation/GenerationForm";
import GenerationPreview from "@/components/generation/GenerationPreview";
import { Sparkles, Layers, BookOpen, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const {
    data,
    sourceMeta,
    status,
    isLoading,
    error,
    generate,
    refine,
    retry,
    cancel,
    reset,
    setData,
  } = useGeneration();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      {!data && (
        <header className="text-center mb-10 pt-4 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 border border-[#2d2d2d] text-sm font-hand text-[#2d2d2d] mb-4 rotate-[-1deg]">
            <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
            <span>Google Gemini 2.5 Structured Output</span>
            <span>&bull;</span>
            <span className="font-bold">Zero Hallucinations</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 rotate-[-1deg] relative inline-block font-hand text-[#2d2d2d]">
            Transform Your Notes Into{" "}
            <span className="text-yellow-500 scribble-underline relative inline-block">
              Study Gold
              <Sparkles className="w-7 h-7 text-yellow-400 absolute -top-4 -right-8 animate-pulse hidden sm:block" />
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mt-2 rotate-[1deg]">
            Tired of messy PDFs? Our AI sketches out flashcards, quizzes, and study plans from your
            raw lecture notes in seconds.
          </p>
        </header>
      )}

      {/* Main Interactive Flow */}
      <section className="relative">
        {data ? (
          <GenerationPreview
            data={data}
            sourceMeta={sourceMeta}
            onRefine={refine}
            onReset={reset}
            setData={setData}
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

      {/* 3 Value Proposition Sketch Cards when no data */}
      {!data && (
        <section className="pt-10 border-t-2 border-dashed border-[#2d2d2d]/30 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-bold font-hand text-[#2d2d2d]">
              Handcrafted for Mastery, Not Unpredictable Chat
            </h2>
            <p className="text-lg text-slate-600">
              Strict schema contracts guarantee clean, testable study tools every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm rotate-1 card-3d-hover">
              <div className="w-10 h-10 bg-yellow-200 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-[#2d2d2d]" />
              </div>
              <h3 className="text-xl font-bold font-hand mb-2">3D Active Recall Cards</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Flip cards with smooth 3D animations, progressive clues, Anki-style difficulty grading, and auditory speech synthesis.
              </p>
            </div>

            <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm -rotate-1 card-3d-hover">
              <div className="w-10 h-10 bg-blue-200 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-[#2d2d2d]" />
              </div>
              <h3 className="text-xl font-hand font-bold mb-2">Self-Test & Re-test Mistakes</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                4-option multiple choice quizzes with auto-grading. Isolates incorrect questions so you can drill until 100% mastery.
              </p>
            </div>

            <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm rotate-1 card-3d-hover">
              <div className="w-10 h-10 bg-green-200 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-[#2d2d2d]" />
              </div>
              <h3 className="text-xl font-hand font-bold mb-2">Deterministic Schemas</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Every response is validated by Zod with automated JSON healing passes, ensuring reliable structured outputs.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
