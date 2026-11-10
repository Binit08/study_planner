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
  Download,
  Copy,
  Check,
  Undo2,
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
  setData,
  isLoading,
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [checklistItems, setChecklistItems] = useState(data?.checklist || []);
  const [progressMap, setProgressMap] = useState({});
  const [copiedMd, setCopiedMd] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);
  const [versionNumber, setVersionNumber] = useState(1);
  const [lastRefinementNote, setLastRefinementNote] = useState(null);

  const flashcards = data?.flashcards || [];
  const quiz = data?.quiz || [];

  // Determine available views based on what was generated
  const availableViews = [];
  if (flashcards.length > 0) availableViews.push("flashcards");
  if (quiz.length > 0) availableViews.push("quiz");
  if (checklistItems.length > 0) availableViews.push("checklist");

  const [activeView, setActiveView] = useState(availableViews[0] || "flashcards");

  // Track review counts for tab headers
  const reviewedCardsCount = Object.keys(progressMap).length;
  const doneChecklistCount = checklistItems.filter((i) => i.completed).length;

  const handleUpdateProgress = (cardIndex, status) => {
    setProgressMap((prev) => ({ ...prev, [cardIndex]: status }));
  };

  // Anki CSV Export
  const handleExportAnki = () => {
    if (!flashcards || flashcards.length === 0) return;
    const rows = [
      "#separator:comma",
      "#html:false",
      ...flashcards.map((c) => {
        const front = `"${(c.front || "").replace(/"/g, '""')}"`;
        const back = `"${(c.back || "").replace(/"/g, '""')}"`;
        return `${front},${back}`;
      }),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    const filename = `${(data?.title || "study-set").toLowerCase().replace(/[^a-z0-9]/g, "-")}-anki.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Markdown
  const handleCopyMarkdown = async () => {
    let md = `# ${data?.title || "Study Set"}\nTopic: ${data?.topic || "General"}\n\n`;
    if (data?.summary) md += `> ${data.summary}\n\n`;

    if (flashcards.length > 0) {
      md += `## 📚 Flashcards (${flashcards.length})\n\n`;
      flashcards.forEach((card, idx) => {
        md += `### Card ${idx + 1}\n**Q:** ${card.front}\n**A:** ${card.back}\n\n`;
      });
    }

    if (quiz.length > 0) {
      md += `## 📝 Quiz Assessment (${quiz.length} Questions)\n\n`;
      quiz.forEach((q, idx) => {
        md += `### Q${idx + 1}: ${q.question}\n`;
        q.options.forEach((opt, oIdx) => {
          const isCorrect = oIdx === q.correctAnswerIndex;
          md += `- [${isCorrect ? "x" : " "}] ${opt}${isCorrect ? " *(Correct)*" : ""}\n`;
        });
        if (q.explanation) md += `\n*Explanation:* ${q.explanation}\n\n`;
      });
    }

    if (checklistItems.length > 0) {
      md += `## ✅ Mastery Checklist\n\n`;
      checklistItems.forEach((item) => {
        md += `- [${item.completed ? "x" : " "}] ${item.task}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2200);
    } catch {
      alert("Unable to copy to clipboard.");
    }
  };

  // Refinement with Undo History
  const handleRefine = (prompt) => {
    setHistoryStack((prev) => [...prev, data]);
    setVersionNumber((v) => v + 1);
    setLastRefinementNote(prompt);
    onRefine(prompt);
  };

  const handleUndoRefinement = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setVersionNumber((v) => Math.max(1, v - 1));
    setLastRefinementNote(null);
    if (setData) {
      setData(previous);
      setChecklistItems(previous?.checklist || []);
    }
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
      badge: `${reviewedCardsCount}/${flashcards.length} reviewed`,
      color: "accent-blue",
      bgActive: "bg-accent-blue/15 border-accent-blue/50 text-accent-blue shadow-sm",
      bgHover: "hover:bg-accent-blue/5 hover:border-accent-blue/20",
    },
    quiz: {
      icon: BookOpen,
      label: "Quiz",
      badge: `${quiz.length} Questions`,
      color: "accent-amber",
      bgActive: "bg-accent-amber/15 border-accent-amber/50 text-accent-amber shadow-sm",
      bgHover: "hover:bg-accent-amber/5 hover:border-accent-amber/20",
    },
    checklist: {
      icon: CheckSquare,
      label: "Checklist",
      badge: `${doneChecklistCount}/${checklistItems.length} completed`,
      color: "accent-sky",
      bgActive: "bg-accent-sky/15 border-accent-sky/50 text-accent-sky shadow-sm",
      bgHover: "hover:bg-accent-sky/5 hover:border-accent-sky/20",
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <Card className="border-border-subtle bg-surface/60 backdrop-blur-xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="accent" size="xs">
                {data.topic || "General Study"}
              </Badge>
              {sourceMeta?.name && (
                <span className="text-[11px] text-accent-sky font-mono bg-accent-sky/10 border border-accent-sky/20 px-2 py-0.5 rounded-md">
                  PDF: {sourceMeta.name}
                </span>
              )}
              {versionNumber > 1 && (
                <span className="text-[11px] text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  v{versionNumber} Refined
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

          {/* Action Tools: Export, Copy, Save, Reset */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Anki Export */}
            {flashcards.length > 0 && (
              <button
                type="button"
                onClick={handleExportAnki}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-surface text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-translucent transition-all flex items-center gap-1.5"
                title="Download standard 2-column Anki CSV file"
              >
                <Download className="w-3.5 h-3.5" />
                Anki CSV
              </button>
            )}

            {/* Copy Markdown */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                copiedMd
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-translucent"
              }`}
              title="Copy complete study set to clipboard as Markdown"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMd ? "Copied!" : "Copy MD"}
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-surface text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-surface-hover transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Prompt
            </button>

            {/* Save to Supabase */}
            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-accent-amber to-accent-sky text-black hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save to Library"}
            </button>
          </div>
        </div>

        {/* Delta Refinement Notification Banner if version > 1 */}
        {versionNumber > 1 && (
          <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between gap-3 text-xs">
            <span className="text-text-secondary truncate">
              <span className="text-amber-300 font-semibold mr-1.5">&bull; Refinement applied:</span>
              {lastRefinementNote || "Study deck updated"}
            </span>
            <button
              type="button"
              onClick={handleUndoRefinement}
              className="text-text-tertiary hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px] flex-shrink-0"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo Refinement (v{versionNumber - 1})
            </button>
          </div>
        )}
      </Card>

      {/* View Switcher — prominent large tabs with real-time completion stats */}
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
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? cfg.bgActive
                    : `bg-surface/40 border-border-subtle text-text-tertiary ${cfg.bgHover}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{cfg.label}</span>
                </div>
                <span
                  className={`font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded-md ${
                    isActive ? "bg-white/10" : "bg-surface border border-border-subtle"
                  }`}
                >
                  {cfg.badge}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Refinement Loop */}
      <RefinementBar onRefine={handleRefine} isLoading={isLoading} />

      {/* Single Active Content View with State Preservation */}
      <div>
        {/* Flashcards View */}
        {flashcards.length > 0 && (
          <div className={activeView === "flashcards" ? "block space-y-4 animate-fade-in" : "hidden"}>
            <FlashcardViewer
              cards={flashcards}
              title={data.title}
              progressMap={progressMap}
              onUpdateProgress={handleUpdateProgress}
              onRefineCard={handleRefine}
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
