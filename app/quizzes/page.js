"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Plus, RefreshCw, Award, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import QuizPlayer from "@/components/quiz/QuizPlayer";

export default function QuizzesHubPage() {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await fetch("/api/study-sets");
        const json = await res.json();
        if (json.data) {
          const setsWithQuiz = json.data.filter(
            (s) => Array.isArray(s.quiz) && s.quiz.length > 0
          );
          setSets(setsWithQuiz);
          if (setsWithQuiz.length > 0) {
            setSelectedSet(setsWithQuiz[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSets();
  }, []);

  const handleSubmitAttempt = async (answersPayload) => {
    if (!selectedSet?.id) return;

    try {
      await fetch(`/api/study-sets/${selectedSet.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });
    } catch (err) {
      console.error("Failed to submit attempt:", err);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent-yellow" />
            Quiz Assessments
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            4-choice structured questions with explanations, instant scoring, and targeted re-testing of mistakes.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-surface border border-border-subtle hover:bg-surface-hover text-text-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-accent-yellow" />
          Create New Quiz
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-accent-sky animate-spin mx-auto" />
          <p className="text-xs text-text-secondary">Loading your quizzes...</p>
        </div>
      ) : sets.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle mx-auto flex items-center justify-center text-text-tertiary">
            <BookOpen className="w-6 h-6 text-accent-yellow" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-text-primary">No quizzes generated yet</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Generate interactive quizzes with answer explanations and automated scoring from any topic.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-sky text-black hover:opacity-90 transition-all"
          >
            Generate Quiz
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Quiz Selector Tabs */}
          {sets.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {sets.map((set) => {
                const isSelected = selectedSet?.id === set.id;
                return (
                  <button
                    key={set.id}
                    onClick={() => setSelectedSet(set)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-surface-hover text-text-primary border border-border-translucent font-semibold"
                        : "bg-surface/40 text-text-tertiary hover:text-text-secondary border border-border-subtle/50"
                    }`}
                  >
                    <span>{set.title}</span>
                    <span className="font-mono text-[10px] text-accent-yellow">
                      ({set.quiz.length} qs)
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Quiz Player */}
          {selectedSet && (
            <QuizPlayer
              questions={selectedSet.quiz || []}
              title={selectedSet.title}
              onSubmitAttempt={handleSubmitAttempt}
            />
          )}
        </div>
      )}
    </div>
  );
}
