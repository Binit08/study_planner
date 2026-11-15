"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { StudyDeckSkeleton } from "@/components/ui/Skeleton";
import QuizPlayer from "@/components/quiz/QuizPlayer";

export default function QuizzesHubPage() {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSets() {
      try {
        const params = new URLSearchParams(window.location.search);
        const requestedSetId = params.get("setId");

        const res = await fetch("/api/study-sets");
        const json = await res.json();
        if (json.data) {
          const setsWithQuiz = json.data.filter(
            (s) => Array.isArray(s.quiz) && s.quiz.length > 0
          );
          setSets(setsWithQuiz);
          if (setsWithQuiz.length > 0) {
            const matched = requestedSetId
              ? setsWithQuiz.find((s) => s.id === requestedSetId)
              : null;
            setSelectedSet(matched || setsWithQuiz[0]);
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

    const res = await fetch(`/api/study-sets/${selectedSet.id}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: answersPayload }),
    });
    if (!res.ok) {
      throw new Error("Failed to save quiz attempt");
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-slate-200 pb-3">
        <h1 className="text-3xl font-bold font-hand text-slate-900 flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-yellow-600" />
          Quizzes
        </h1>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {selectedSet && (
            <Link
              href={`/study/${selectedSet.id}`}
              className="text-sm sm:text-base font-bold font-hand text-yellow-700 hover:underline"
            >
              Full Study Mode →
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400 text-slate-900 font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Set
          </Link>
        </div>
      </div>

      {/* Set Selector Pills */}
      {sets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-base font-bold font-hand text-slate-500 mr-1 flex-shrink-0">
            Select Quiz:
          </span>
          {sets.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSet(s)}
              className={`px-4 py-2 wobbly-border-sm hard-shadow-sm font-bold font-hand text-lg transition-all flex-shrink-0 ${
                selectedSet?.id === s.id
                  ? "bg-yellow-300 text-slate-900 -rotate-1"
                  : "bg-white text-slate-700 hover:bg-yellow-50"
              }`}
            >
              {s.title} ({s.quiz?.length || 0})
            </button>
          ))}
        </div>
      )}

      {/* Main Quiz Player */}
      {loading ? (
        <StudyDeckSkeleton />
      ) : selectedSet && selectedSet.quiz?.length > 0 ? (
        <QuizPlayer
          key={selectedSet.id}
          questions={selectedSet.quiz}
          title={selectedSet.title}
          onSubmitAttempt={handleSubmitAttempt}
        />
      ) : (
        <div className="bg-white p-12 wobbly-border hard-shadow text-center space-y-4 max-w-xl mx-auto">
          <BookOpen className="w-16 h-16 text-yellow-400 mx-auto" />
          <h2 className="text-3xl font-bold font-hand text-slate-900">No Quizzes Available</h2>
          <p className="text-lg text-slate-600 font-hand">
            No quiz drills have been generated yet. Use the StudyGold assistant to create practice questions from your material.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-400 text-slate-900 font-bold font-hand text-xl wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 transition-all"
          >
            Generate Quiz Set
          </Link>
        </div>
      )}
    </div>
  );
}
