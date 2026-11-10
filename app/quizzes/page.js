"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Plus, Sparkles } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-dashed border-slate-200 pb-6">
        <div className="rotate-[-0.5deg]">
          <div className="inline-block px-3 py-1 bg-yellow-100 wobbly-border-sm text-xs font-bold uppercase mb-2">
            Assessment &amp; Drill Mode
          </div>
          <h1 className="text-4xl font-bold font-hand text-slate-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-yellow-600" />
            Quiz Practice
          </h1>
          <p className="text-lg text-slate-600 font-hand mt-1">
            Test comprehension, get instant evaluation, and drill down on incorrect answers.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-slate-900 font-bold font-hand text-xl wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create New Set
        </Link>
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
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 bg-yellow-300 flex items-center justify-center rounded-2xl border-2 border-slate-800 mx-auto animate-spin">
            <Sparkles className="w-6 h-6 text-slate-800" />
          </div>
          <p className="text-xl font-hand text-slate-600">Loading quiz questions...</p>
        </div>
      ) : selectedSet && selectedSet.quiz?.length > 0 ? (
        <QuizPlayer
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
