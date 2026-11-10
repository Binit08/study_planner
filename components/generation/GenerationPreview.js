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
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [checklistItems, setChecklistItems] = useState(data?.checklist || []);
  const [progressMap, setProgressMap] = useState({});

  const flashcards = data?.flashcards || [];
  const quiz = data?.quiz || [];

  // Determine available views based on what was generated
  const availableViews = [];
  if (flashcards.length > 0) availableViews.push("flashcards");
  if (quiz.length > 0) availableViews.push("quiz");
  if (checklistItems.length > 0) availableViews.push("checklist");

  const [activeView, setActiveView] = useState(availableViews[0] || "flashcards");

  const handleUpdateProgress = (cardIndex, status) => {
    setProgressMap((prev) => ({ ...prev, [cardIndex]: status }));
  };

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

  const viewConfig = {
    flashcards: {
      icon: Layers,
      label: "Flashcards",
      count: flashcards.length,
      color: "accent-blue",
      bgActive: "bg-accent-blue/15 border-accent-blue/50 text-accent-blue",
      bgHover: "hover:bg-accent-blue/5 hover:border-accent-blue/20",
    },
    quiz: {
      icon: BookOpen,
      label: "Quiz",
      count: quiz.length,
      color: "accent-amber",
      bgActive: "bg-accent-amber/15 border-accent-amber/50 text-accent-amber",
      bgHover: "hover:bg-accent-amber/5 hover:border-accent-amber/20",
    },
    checklist: {
      icon: CheckSquare,
      label: "Checklist",
      count: checklistItems.length,
      color: "accent-sky",
      bgActive: "bg-accent-sky/15 border-accent-sky/50 text-accent-sky",
      bgHover: "hover:bg-accent-sky/5 hover:border-accent-sky/20",
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
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
      </Card>

      {/* View Switcher — prominent large tabs */}
      {availableViews.length > 1 && (
        <div className="flex items-center gap-3">
          {availableViews.map((viewId) => {
            const cfg = viewConfig[viewId];
            const Icon = cfg.icon;
            const isActive = activeView === viewId;

            return (
              <button
                key={viewId}
                onClick={() => setActiveView(viewId)}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  isActive
                    ? cfg.bgActive
                    : `bg-surface/40 border-border-subtle text-text-tertiary ${cfg.bgHover}`
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{cfg.label}</span>
                <span
                  className={`font-mono text-xs px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-white/10"
                      : "bg-surface border border-border-subtle"
                  }`}
                >
                  {cfg.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Refinement Loop */}
      <RefinementBar onRefine={onRefine} isLoading={isLoading} />

      {/* Single Active Content View with Tab State Preservation */}
      <div>
        {/* Flashcards View */}
        {flashcards.length > 0 && (
          <div className={activeView === "flashcards" ? "block space-y-4 animate-fade-in" : "hidden"}>
            <FlashcardViewer
              cards={flashcards}
              title={data.title}
              progressMap={progressMap}
              onUpdateProgress={handleUpdateProgress}
            />
          </div>
        )}

        {/* Quiz View (State preserved across tab switches) */}
        {quiz.length > 0 && (
          <div className={activeView === "quiz" ? "block space-y-4 animate-fade-in" : "hidden"}>
            <QuizPlayer questions={quiz} title={data.title} />
          </div>
        )}

        {/* Checklist View */}
        {checklistItems.length > 0 && (
          <div className={activeView === "checklist" ? "block space-y-4 animate-fade-in" : "hidden"}>
            <StudyChecklist
              items={checklistItems}
              onToggleItem={handleToggleChecklist}
              onAddItem={handleAddChecklist}
              onDeleteItem={handleDeleteChecklist}
            />
          </div>
        )}
      </div>
    </div>
  );
}
