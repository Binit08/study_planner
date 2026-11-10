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
  PlusCircle,
  FileText,
} from "lucide-react";
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
  const [checklistItems, setChecklistItems] = useState(data?.checklist || []);
  const [progressMap, setProgressMap] = useState({});
  const [copiedMd, setCopiedMd] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);
  const [versionNumber, setVersionNumber] = useState(1);
  const [lastRefinementNote, setLastRefinementNote] = useState(null);

  const flashcards = data?.flashcards || [];
  const quiz = data?.quiz || [];

  const availableViews = [];
  if (flashcards.length > 0) availableViews.push("flashcards");
  if (quiz.length > 0) availableViews.push("quiz");
  if (checklistItems.length > 0) availableViews.push("checklist");

  const [activeView, setActiveView] = useState(availableViews[0] || "flashcards");

  const reviewedCardsCount = Object.keys(progressMap).length;
  const doneChecklistCount = checklistItems.filter((i) => i.completed).length;

  const handleUpdateProgress = (cardIndex, status) => {
    setProgressMap((prev) => ({ ...prev, [cardIndex]: status }));
  };

  // Anki Export
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

  // Refine with Undo Stack
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
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-dashed border-[#2d2d2d]/30 pb-6">
        <div>
          <span className="text-sm font-bold uppercase tracking-wider bg-yellow-200 border border-[#2d2d2d] px-2.5 py-0.5 rounded-full inline-block mb-2">
            Study Set Generated ✨
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-hand text-[#2d2d2d]">
            {data.title || "Your Study Set Ready!"}
          </h1>
          {data.summary && (
            <p className="text-lg text-slate-600 max-w-3xl mt-1 leading-relaxed">
              {data.summary}
            </p>
          )}
        </div>
      </header>

      {/* Main 2-Column Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Summary Card, Export & Refinement (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Card with tape effect */}
          <div className="bg-white p-6 wobbly-border hard-shadow tape-effect relative rotate-1 space-y-4">
            <h2 className="text-2xl font-bold font-hand mb-2">Set Summary</h2>
            <div className="space-y-2 text-lg">
              <p>
                <span className="font-bold">Topic:</span> {data.topic || "General"}
              </p>
              <p>
                <span className="font-bold">Source:</span>{" "}
                {sourceMeta?.name ? sourceMeta.name : "Text Notes"}
              </p>
              <p>
                <span className="font-bold">Version:</span> v{versionNumber}.0{" "}
                {versionNumber > 1 ? "Refined" : "Fresh"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-400 text-[#2d2d2d] font-bold text-xl font-hand wobbly-border-sm hard-shadow-sm hover:translate-y-0.5 transition-all btn-press cursor-pointer"
              >
                <span>{isSaving ? "Saving..." : "Save to Library"}</span>
                <Save className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-800 font-bold text-lg font-hand wobbly-border-sm hard-shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                <span>Generate New</span>
                <PlusCircle className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          {/* Quick Export Card */}
          <div className="p-6 border-2 border-dashed border-slate-300 wobbly-border-sm bg-slate-50 rotate-[-1deg] space-y-3">
            <h3 className="text-xl font-bold font-hand">Quick Export</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportAnki}
                className="flex flex-col items-center justify-center p-3 bg-white border-2 border-slate-800 wobbly-border-sm hard-shadow-sm hover:bg-yellow-50 transition-all font-bold text-sm uppercase"
                title="Download 2-column Anki CSV"
              >
                <Download className="w-5 h-5 mb-1 text-slate-700" />
                <span>Anki CSV</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMarkdown}
                className={`flex flex-col items-center justify-center p-3 border-2 border-slate-800 wobbly-border-sm hard-shadow-sm transition-all font-bold text-sm uppercase ${
                  copiedMd ? "bg-green-200" : "bg-white hover:bg-yellow-50"
                }`}
                title="Copy formatted Markdown"
              >
                {copiedMd ? (
                  <Check className="w-5 h-5 mb-1 text-green-700" />
                ) : (
                  <Copy className="w-5 h-5 mb-1 text-slate-700" />
                )}
                <span>{copiedMd ? "Copied!" : "Copy MD"}</span>
              </button>
            </div>
          </div>

          {/* Refinement Loop */}
          <div className="space-y-3">
            <RefinementBar onRefine={handleRefine} isLoading={isLoading} />
            {versionNumber > 1 && (
              <button
                type="button"
                onClick={handleUndoRefinement}
                className="w-full py-2 bg-yellow-100 border border-slate-400 rounded-xl text-sm font-bold text-slate-700 hover:bg-yellow-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                Revert to v{versionNumber - 1}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Tab Viewers (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab buttons */}
          <div className="flex flex-wrap gap-3">
            {flashcards.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView("flashcards")}
                className={`px-6 py-2.5 font-bold text-xl font-hand wobbly-border-sm transition-all rotate-1 ${
                  activeView === "flashcards"
                    ? "bg-yellow-400 hard-shadow-sm scale-105"
                    : "bg-white hover:bg-yellow-50"
                }`}
              >
                Flashcards ({flashcards.length})
              </button>
            )}

            {quiz.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView("quiz")}
                className={`px-6 py-2.5 font-bold text-xl font-hand wobbly-border-sm transition-all -rotate-1 ${
                  activeView === "quiz"
                    ? "bg-yellow-400 hard-shadow-sm scale-105"
                    : "bg-white hover:bg-yellow-50"
                }`}
              >
                Quiz ({quiz.length})
              </button>
            )}

            {checklistItems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView("checklist")}
                className={`px-6 py-2.5 font-bold text-xl font-hand wobbly-border-sm transition-all rotate-1 ${
                  activeView === "checklist"
                    ? "bg-yellow-400 hard-shadow-sm scale-105"
                    : "bg-white hover:bg-yellow-50"
                }`}
              >
                Checklist ({doneChecklistCount}/{checklistItems.length})
              </button>
            )}
          </div>

          {/* View Components with State Preservation */}
          <div className="space-y-6">
            {/* Flashcards View */}
            {flashcards.length > 0 && (
              <div className={activeView === "flashcards" ? "block" : "hidden"}>
                <FlashcardViewer
                  cards={flashcards}
                  title={data.title}
                  progressMap={progressMap}
                  onUpdateProgress={handleUpdateProgress}
                  onRefineCard={handleRefine}
                />
              </div>
            )}

            {/* Quiz View */}
            {quiz.length > 0 && (
              <div className={activeView === "quiz" ? "block" : "hidden"}>
                <QuizPlayer questions={quiz} title={data.title} />
              </div>
            )}

            {/* Checklist View */}
            {checklistItems.length > 0 && (
              <div className={activeView === "checklist" ? "block" : "hidden"}>
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
      </main>
    </div>
  );
}
