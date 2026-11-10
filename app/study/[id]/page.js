"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Layers,
  BookOpen,
  CheckSquare,
  ArrowLeft,
  RefreshCw,
  Award,
  Sparkles,
  Calendar,
  Trash2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FlashcardViewer from "@/components/flashcards/FlashcardViewer";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import StudyChecklist from "@/components/checklist/StudyChecklist";

export default function StudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("flashcards");
  const [progressMap, setProgressMap] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [checklist, setChecklist] = useState([]);

  const loadData = async () => {
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

      // Build progress map from server data
      const pMap = {};
      (data.progress || []).forEach((p) => {
        pMap[p.card_index] = p.status;
      });
      setProgressMap(pMap);

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
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateCardProgress = async (cardIndex, status) => {
    setProgressMap((prev) => ({ ...prev, [cardIndex]: status }));
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

  const handleAddChecklist = async (task) => {
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, studySetId: id }),
      });
      const json = await res.json();
      if (json.data) {
        setChecklist((prev) => [...prev, json.data]);
      }
    } catch (err) {
      console.error("Failed to add checklist item:", err);
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

  const handleDeleteSet = async () => {
    if (!window.confirm(`Are you sure you want to delete "${studySet?.title}"?`)) return;
    try {
      await fetch(`/api/study-sets/${id}`, { method: "DELETE" });
      router.push("/history");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-accent-sky animate-spin mx-auto" />
        <p className="text-xs text-text-secondary">Loading study workspace...</p>
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <Card className="text-center py-16 border-rose-500/30 bg-rose-950/10 space-y-3">
        <p className="text-sm text-rose-200">Study set not found or error loading.</p>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-surface border border-border-subtle text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </Card>
    );
  }

  const flashcards = studySet.flashcards || [];
  const quiz = studySet.quiz || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Metadata Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Library
          </Link>

          <button
            onClick={handleDeleteSet}
            className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Set
          </button>
        </div>

        <Card className="p-6 bg-surface/60 backdrop-blur-xl border-border-subtle relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="xs">
                  {studySet.topic || "General"}
                </Badge>
                {studySet.source_type === "pdf" && (
                  <span className="text-[11px] text-accent-sky font-mono">PDF Source</span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                {studySet.title}
              </h1>
              {studySet.source_preview && (
                <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                  {studySet.source_preview}
                </p>
              )}
            </div>

            {/* Quick stats pill */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-surface border border-border-subtle px-3 py-2 rounded-xl text-xs">
              <div className="text-center px-2">
                <span className="block font-bold text-text-primary font-mono">
                  {flashcards.length}
                </span>
                <span className="text-[10px] text-text-tertiary uppercase">Cards</span>
              </div>
              <div className="w-[1px] h-6 bg-border-subtle" />
              <div className="text-center px-2">
                <span className="block font-bold text-text-primary font-mono">{quiz.length}</span>
                <span className="text-[10px] text-text-tertiary uppercase">Questions</span>
              </div>
              <div className="w-[1px] h-6 bg-border-subtle" />
              <div className="text-center px-2">
                <span className="block font-bold text-accent-sky font-mono">{attempts.length}</span>
                <span className="text-[10px] text-text-tertiary uppercase">Attempts</span>
              </div>
            </div>
          </div>

          {/* Tab Selector — prominent view switcher */}
          <div className="flex items-center gap-3 pt-6 border-t border-border-subtle/80 mt-5">
            {flashcards.length > 0 && (
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === "flashcards"
                    ? "bg-accent-blue/15 border-accent-blue/50 text-accent-blue"
                    : "bg-surface/40 border-border-subtle text-text-tertiary hover:bg-accent-blue/5 hover:border-accent-blue/20"
                }`}
              >
                <Layers className="w-4 h-4" />
                Flashcards
                <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                  activeTab === "flashcards" ? "bg-white/10" : "bg-surface border border-border-subtle"
                }`}>{flashcards.length}</span>
              </button>
            )}

            {quiz.length > 0 && (
              <button
                onClick={() => setActiveTab("quiz")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === "quiz"
                    ? "bg-accent-amber/15 border-accent-amber/50 text-accent-amber"
                    : "bg-surface/40 border-border-subtle text-text-tertiary hover:bg-accent-amber/5 hover:border-accent-amber/20"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Quiz
                <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                  activeTab === "quiz" ? "bg-white/10" : "bg-surface border border-border-subtle"
                }`}>{quiz.length}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("checklist")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                activeTab === "checklist"
                  ? "bg-accent-sky/15 border-accent-sky/50 text-accent-sky"
                  : "bg-surface/40 border-border-subtle text-text-tertiary hover:bg-accent-sky/5 hover:border-accent-sky/20"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Checklist
              <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                activeTab === "checklist" ? "bg-white/10" : "bg-surface border border-border-subtle"
              }`}>{checklist.length}</span>
            </button>

            {attempts.length > 0 && (
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === "history"
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                    : "bg-surface/40 border-border-subtle text-text-tertiary hover:bg-emerald-500/5 hover:border-emerald-500/20"
                }`}
              >
                <Award className="w-4 h-4" />
                History
                <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                  activeTab === "history" ? "bg-white/10" : "bg-surface border border-border-subtle"
                }`}>{attempts.length}</span>
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === "flashcards" && (
          <FlashcardViewer
            cards={flashcards}
            title={studySet.title}
            progressMap={progressMap}
            onUpdateProgress={handleUpdateCardProgress}
          />
        )}

        {activeTab === "quiz" && (
          <QuizPlayer
            questions={quiz}
            title={studySet.title}
            onSubmitAttempt={handleSubmitQuizAttempt}
          />
        )}

        {activeTab === "checklist" && (
          <div className="max-w-2xl mx-auto">
            <StudyChecklist
              items={checklist}
              onToggleItem={handleToggleChecklist}
              onAddItem={handleAddChecklist}
              onDeleteItem={handleDeleteChecklist}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Past Quiz Submissions
            </h3>

            <div className="space-y-3">
              {attempts.map((att, idx) => {
                const pct = Math.round((att.score / att.total_questions) * 100);
                const passed = pct >= 70;
                const dateStr = att.created_at
                  ? new Date(att.created_at).toLocaleString()
                  : "Recent";

                return (
                  <Card key={att.id || idx} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          Score: {att.score} / {att.total_questions} ({pct}%)
                        </span>
                        <Badge variant={passed ? "mastered" : "learning"} size="xs">
                          {passed ? "Passed" : "Needs Review"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-text-tertiary">{dateStr}</p>
                    </div>

                    <span className="text-lg font-bold font-mono text-text-primary">{pct}%</span>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

