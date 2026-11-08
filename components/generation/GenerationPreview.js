"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Layers,
  BookOpen,
  CheckSquare,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FlashcardViewer from "@/components/flashcards/FlashcardViewer";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import StudyChecklist from "@/components/checklist/StudyChecklist";
import RefinementBar from "./RefinementBar";

export default function GenerationPreview({
  data,
  sourceMeta,
  onRefine,
  onReset,
  isLoading,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all"); // "all" | "flashcards" | "quiz" | "checklist"
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [checklistItems, setChecklistItems] = useState(data?.checklist || []);

  const flashcards = data?.flashcards || [];
  const quiz = data?.quiz || [];

  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/study-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title || "Untitled Study Set",
          topic: data.topic || "General",
          sourceType: sourceMeta?.type || "text",
          sourcePreview: data.summary || (sourceMeta?.name ? `From ${sourceMeta.name}` : ""),
          mode: data.mode || "both",
          flashcards,
          quiz,
          checklist: checklistItems,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to save study set");
      }

      setSavedId(json.data.id);
      router.push(`/study/${json.data.id}`);
    } catch (err) {
      alert(`Error saving study set: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleChecklist = (id, completed) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => ((item.id || idx) === id ? { ...item, completed } : item))
    );
  };

  const handleAddChecklist = (task) => {
    setChecklistItems((prev) => [...prev, { task, completed: false }]);
  };

  const handleDeleteChecklist = (id) => {
    setChecklistItems((prev) => prev.filter((item, idx) => (item.id || idx) !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header Bar */}
      <Card className="border-border-subtle bg-surface/60 backdrop-blur-xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="xs">
                {data.topic || "General Study"}
              </Badge>
              {sourceMeta?.name && (
                <span className="text-[11px] text-text-tertiary">
                  Source: {sourceMeta.name}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {data.title}
            </h2>
            {data.summary && (
              <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                {data.summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-surface text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-surface-hover transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Prompt
            </button>
            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-accent-amber to-accent-sky text-black hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save to Library"}
            </button>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-2 pt-6 border-t border-border-subtle/80 mt-5">
          {[
            { id: "all", label: "Overview & All", count: null },
            { id: "flashcards", label: "Flashcards", count: flashcards.length },
            { id: "quiz", label: "Quiz", count: quiz.length },
            { id: "checklist", label: "Checklist", count: checklistItems.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-surface-hover text-text-primary border border-border-translucent font-semibold"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="font-mono text-[10px] px-1 rounded bg-surface border border-border-subtle">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Refinement Loop */}
      <RefinementBar onRefine={onRefine} isLoading={isLoading} />

      {/* Content Viewers */}
      <div className="space-y-10">
        {/* Flashcards Section */}
        {(activeTab === "all" || activeTab === "flashcards") && flashcards.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-blue" />
              <h3 className="text-base font-semibold tracking-tight text-text-primary">
                Interactive Flashcards ({flashcards.length})
              </h3>
            </div>
            <FlashcardViewer cards={flashcards} title={data.title} />
          </section>
        )}

        {/* Quiz Section */}
        {(activeTab === "all" || activeTab === "quiz") && quiz.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-border-subtle/60">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-yellow" />
              <h3 className="text-base font-semibold tracking-tight text-text-primary">
                Self-Assessment Quiz ({quiz.length} Questions)
              </h3>
            </div>
            <QuizPlayer questions={quiz} title={data.title} />
          </section>
        )}

        {/* Checklist Section */}
        {(activeTab === "all" || activeTab === "checklist") && checklistItems.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-border-subtle/60">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-accent-sky" />
              <h3 className="text-base font-semibold tracking-tight text-text-primary">
                Mastery Checklist
              </h3>
            </div>
            <StudyChecklist
              items={checklistItems}
              onToggleItem={handleToggleChecklist}
              onAddItem={handleAddChecklist}
              onDeleteItem={handleDeleteChecklist}
            />
          </section>
        )}
      </div>
    </div>
  );
}
