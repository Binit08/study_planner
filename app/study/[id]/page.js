"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Layers,
  BookOpen,
  CheckSquare,
  ArrowLeft,
  Sparkles,
  Trash2,
  Download,
  Copy,
  Check,
  Award,
  FileText,
  FileUp,
  Timer,
} from "lucide-react";
import FlashcardViewer from "@/components/flashcards/FlashcardViewer";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import StudyChecklist from "@/components/checklist/StudyChecklist";
import FocusTimer from "@/components/planner/FocusTimer";
import StudyAttemptsList from "@/components/study/StudyAttemptsList";
import { buildStudySetMarkdown, downloadAnkiCsv } from "@/lib/exportStudySet";

export default function StudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("flashcards");
  const [progressMap, setProgressMap] = useState({});
  const [dueMap, setDueMap] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [copiedMd, setCopiedMd] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/study-sets/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load study set");

      const data = json.data;
      setStudySet(data);
      setAttempts(data.attempts || []);
      setChecklist(data.checklist || []);

      // Build progress and due maps from server data
      const pMap = {};
      const dMap = {};
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      (data.progress || []).forEach((p) => {
        pMap[p.card_index] = p.status;
        if (p.status !== "unseen" && p.next_review_at) {
          dMap[p.card_index] = new Date(p.next_review_at).getTime() <= endOfToday.getTime();
        }
      });
      setProgressMap(pMap);
      setDueMap(dMap);

      // Default active tab based on available items
      if (data.flashcards?.length > 0) {
        setActiveTab("flashcards");
      } else if (data.quiz?.length > 0) {
        setActiveTab("quiz");
      } else {
        setActiveTab("checklist");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateCardProgress = async (cardIndex, status) => {
    setProgressMap((prev) => ({ ...prev, [cardIndex]: status }));
    setDueMap((prev) => ({ ...prev, [cardIndex]: false }));
    try {
      await fetch(`/api/study-sets/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIndex, status }),
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  const handleSubmitQuizAttempt = async (answersPayload) => {
    try {
      const res = await fetch(`/api/study-sets/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });
      const json = await res.json();
      if (json.data?.attempt) {
        setAttempts((prev) => [json.data.attempt, ...prev]);
      }
    } catch (err) {
      console.error("Failed to record quiz attempt:", err);
    }
  };

  const handleToggleChecklist = async (itemId, completed) => {
    setChecklist((prev) =>
      prev.map((i) => ((i.id || i) === itemId ? { ...i, completed } : i))
    );

    try {
      if (typeof itemId === "string") {
        await fetch(`/api/checklist/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        });
      }
    } catch (err) {
      console.error("Failed to toggle checklist:", err);
    }
  };

  const handleAddChecklist = async (payload) => {
    const body =
      typeof payload === "string"
        ? { task: payload, studySetId: id }
        : { ...payload, studySetId: id };

    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.data) {
        setChecklist((prev) => [...prev, json.data]);
      }
    } catch (err) {
      console.error("Failed to add checklist item:", err);
    }
  };

  const handleScheduleChecklistToday = async (itemId) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    setChecklist((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, scheduled_date: todayStr } : i))
    );

    try {
      await fetch(`/api/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: todayStr }),
      });
    } catch (err) {
      console.error("Failed to schedule checklist item:", err);
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    setChecklist((prev) => prev.filter((i) => i.id !== itemId));
    try {
      if (typeof itemId === "string") {
        await fetch(`/api/checklist/${itemId}`, { method: "DELETE" });
      }
    } catch (err) {
      console.error("Failed to delete checklist item:", err);
    }
  };

  const handleExportAnki = () => {
    downloadAnkiCsv(flashcards, studySet?.title);
  };

  const handleCopyMarkdown = async () => {
    const md = buildStudySetMarkdown({
      title: studySet?.title,
      topic: studySet?.topic,
      summary: studySet?.source_preview,
      flashcards,
      quiz,
      checklist,
    });

    try {
      setActionError(null);
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2200);
    } catch {
      setActionError("Unable to copy to clipboard. Check browser clipboard permissions.");
    }
  };

  const handleDeleteSet = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/study-sets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete study set");
      }
      router.push("/history");
    } catch (err) {
      setActionError(err.message);
      setConfirmDelete(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 bg-yellow-300 flex items-center justify-center rounded-2xl border-2 border-slate-800 mx-auto animate-spin">
          <Sparkles className="w-6 h-6 text-slate-800" />
        </div>
        <p className="text-xl font-hand text-slate-600">Loading study deck...</p>
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="bg-rose-50 p-10 wobbly-border-sm hard-shadow-sm text-center space-y-4 max-w-xl mx-auto">
        <p className="text-xl font-hand text-rose-700">Study set not found or error loading.</p>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white wobbly-border-sm hard-shadow-sm font-hand font-bold text-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  const flashcards = studySet.flashcards || [];
  const quiz = studySet.quiz || [];
  const masteredCount = flashcards.filter((_, i) => progressMap[i] === "mastered").length;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-xl font-bold font-hand text-slate-700 hover:text-yellow-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Study Library
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTimer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 wobbly-border-sm hard-shadow-sm font-bold font-hand text-base transition-all text-slate-800 ${
              showTimer ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
            }`}
            title="Toggle study focus timer"
          >
            <Timer className="w-4 h-4 text-yellow-700" />
            {showTimer ? "Hide Timer" : "Focus Timer"}
          </button>

          {flashcards.length > 0 && (
            <button
              type="button"
              onClick={handleExportAnki}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white wobbly-border-sm hard-shadow-sm font-bold font-hand text-base hover:bg-yellow-50 transition-all text-slate-800"
              title="Download standard 2-column Anki CSV file"
            >
              <Download className="w-4 h-4 text-yellow-600" />
              Anki (.csv)
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className={`inline-flex items-center gap-1.5 px-4 py-2 bg-white wobbly-border-sm hard-shadow-sm font-bold font-hand text-base transition-all text-slate-800 ${copiedMd ? "bg-green-100 border-green-700" : "hover:bg-yellow-50"
              }`}
            title="Copy complete study set to clipboard as Markdown"
          >
            {copiedMd ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-slate-700" />}
            {copiedMd ? "Copied!" : "Copy MD"}
          </button>

          {confirmDelete ? (
            <div className="inline-flex items-center gap-2 bg-rose-50 px-3 py-1.5 wobbly-border-sm border-2 border-rose-500">
              <span className="font-hand text-sm font-bold text-rose-900">Delete deck?</span>
              <button
                type="button"
                onClick={handleDeleteSet}
                disabled={deleting}
                className="px-2.5 py-0.5 bg-rose-600 text-white rounded font-hand font-bold text-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-2 py-0.5 bg-white border border-slate-300 rounded font-hand font-bold text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white wobbly-border-sm text-slate-400 hover:text-red-500 hover:border-red-500 transition-colors font-bold font-hand text-base"
              title="Delete this study set"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-50 border-2 border-rose-500 p-4 wobbly-border-sm flex items-center justify-between gap-4">
          <p className="font-hand text-base text-rose-800 font-bold">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-hand font-bold text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Optional Embedded Focus Timer */}
      {showTimer && (
        <div className="max-w-md ml-auto">
          <FocusTimer
            defaultStudySetId={studySet.id}
            defaultTopic={studySet.topic || "General"}
          />
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white p-8 wobbly-border hard-shadow relative rotate-[-0.5deg]">
        <div className="tape-effect" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-yellow-100 text-slate-900 font-bold text-xs uppercase wobbly-border-sm">
                {studySet.topic || "General"}
              </span>
              {studySet.source_type === "pdf" ? (
                <span className="flex items-center gap-1 text-xs text-slate-500 font-hand font-bold">
                  <FileUp className="w-3.5 h-3.5" /> PDF Source
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-500 font-hand font-bold">
                  <FileText className="w-3.5 h-3.5" /> Notes Input
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold font-hand text-slate-900 leading-tight">
              {studySet.title}
            </h1>

            {studySet.source_preview && (
              <p className="text-base text-slate-600 max-w-2xl font-hand leading-relaxed">
                {studySet.source_preview}
              </p>
            )}
          </div>

          {/* Quick Stats Box */}
          <div className="flex items-center gap-4 bg-yellow-50/70 p-4 wobbly-border-sm self-start md:self-auto text-center">
            <div className="px-2">
              <span className="block text-2xl font-bold font-hand text-slate-900">{flashcards.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Cards</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-300" />
            <div className="px-2">
              <span className="block text-2xl font-bold font-hand text-slate-900">{quiz.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Quizzes</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-300" />
            <div className="px-2">
              <span className="block text-2xl font-bold font-hand text-slate-900">{attempts.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Attempts</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 pt-6 border-t-2 border-dashed border-slate-200 mt-6 overflow-x-auto">
          {flashcards.length > 0 && (
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 wobbly-border-sm font-bold font-hand text-xl transition-all ${activeTab === "flashcards"
                  ? "bg-yellow-300 hard-shadow-sm -rotate-1 text-slate-900"
                  : "bg-white hover:bg-yellow-50 text-slate-700"
                }`}
            >
              <Layers className="w-5 h-5" />
              Flashcards ({flashcards.length})
            </button>
          )}

          {quiz.length > 0 && (
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 wobbly-border-sm font-bold font-hand text-xl transition-all ${activeTab === "quiz"
                  ? "bg-yellow-300 hard-shadow-sm -rotate-1 text-slate-900"
                  : "bg-white hover:bg-yellow-50 text-slate-700"
                }`}
            >
              <BookOpen className="w-5 h-5" />
              Quiz ({quiz.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 wobbly-border-sm font-bold font-hand text-xl transition-all ${activeTab === "checklist"
                ? "bg-yellow-300 hard-shadow-sm -rotate-1 text-slate-900"
                : "bg-white hover:bg-yellow-50 text-slate-700"
              }`}
          >
            <CheckSquare className="w-5 h-5" />
            Checklist ({checklist.length})
          </button>

          {attempts.length > 0 && (
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 wobbly-border-sm font-bold font-hand text-xl transition-all ${activeTab === "history"
                  ? "bg-yellow-300 hard-shadow-sm -rotate-1 text-slate-900"
                  : "bg-white hover:bg-yellow-50 text-slate-700"
                }`}
            >
              <Award className="w-5 h-5" />
              History ({attempts.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab Views */}
      <div>
        {flashcards.length > 0 && (
          <div className={activeTab === "flashcards" ? "block" : "hidden"}>
            <FlashcardViewer
              cards={flashcards}
              title={studySet.title}
              progressMap={progressMap}
              dueMap={dueMap}
              onUpdateProgress={handleUpdateCardProgress}
            />
          </div>
        )}

        {quiz.length > 0 && (
          <div className={activeTab === "quiz" ? "block" : "hidden"}>
            <QuizPlayer
              questions={quiz}
              title={studySet.title}
              onSubmitAttempt={handleSubmitQuizAttempt}
            />
          </div>
        )}

        <div className={activeTab === "checklist" ? "block max-w-2xl mx-auto" : "hidden"}>
          <StudyChecklist
            items={checklist}
            showScheduleControls={true}
            onToggleItem={handleToggleChecklist}
            onAddItem={handleAddChecklist}
            onDeleteItem={handleDeleteChecklist}
            onScheduleToday={handleScheduleChecklistToday}
          />
        </div>

        {activeTab === "history" && <StudyAttemptsList attempts={attempts} />}
      </div>
    </div>
  );
}
