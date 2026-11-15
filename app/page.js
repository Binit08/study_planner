"use client";

import { useGeneration } from "@/hooks/useGeneration";
import GenerationForm from "@/components/generation/GenerationForm";
import GenerationPreview from "@/components/generation/GenerationPreview";
import { Sparkles } from "lucide-react";

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
    <div className="space-y-4 pb-4">
      {/* Hero Section */}
      {!data && (
        <header className="text-center mb-3 pt-0 relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1.5 rotate-[-0.5deg] relative inline-block font-hand text-[#2d2d2d]">
            Turn Notes Into{" "}
            <span className="text-yellow-500 scribble-underline relative inline-block">
              Study Gold
              <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-2 -right-6 hidden sm:block" />
            </span>
          </h1>

          <p className="text-sm md:text-base font-sans text-slate-600 max-w-xl mx-auto">
            Paste notes or upload a PDF to generate flashcards, quizzes, and a study plan.
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
    </div>
  );
}
