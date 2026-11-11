"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, ChevronRight, ChevronLeft, Info } from "lucide-react";
import FormattedContent from "@/components/ui/FormattedContent";
import QuizResults from "./QuizResults";

export default function QuizPlayer({
  questions = [],
  onSubmitAttempt,
  title = "Quiz Assessment",
}) {
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRetestingWrongOnly, setIsRetestingWrongOnly] = useState(false);
  const [scoreSummary, setScoreSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [confirmingIncompleteSubmit, setConfirmingIncompleteSubmit] = useState(false);

  // Reset state only when the source questions array changes
  useEffect(() => {
    setActiveQuestions(questions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setIsRetestingWrongOnly(false);
    setScoreSummary(null);
    setAttemptSaved(false);
    setConfirmingIncompleteSubmit(false);
  }, [questions]);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = useCallback(
    (optionIndex) => {
      if (isSubmitted) return;
      setConfirmingIncompleteSubmit(false);
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentIndex]: optionIndex,
      }));
    },
    [currentIndex, isSubmitted]
  );

  // Keyboard navigation for options (1, 2, 3, 4, Enter, Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target?.tagName)) return;
      if (["1", "2", "3", "4"].includes(e.key) && !isSubmitted) {
        const optIdx = parseInt(e.key, 10) - 1;
        handleSelectOption(optIdx);
      } else if (e.code === "ArrowRight") {
        if (currentIndex < activeQuestions.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.code === "ArrowLeft") {
        if (currentIndex > 0) {
          setCurrentIndex((i) => i - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, activeQuestions.length, isSubmitted, handleSelectOption]);

  const handleSubmit = async () => {
    if (
      Object.keys(selectedAnswers).length < activeQuestions.length &&
      !confirmingIncompleteSubmit
    ) {
      setConfirmingIncompleteSubmit(true);
      return;
    }

    setConfirmingIncompleteSubmit(false);
    setSubmitting(true);

    const answersPayload = activeQuestions.map((q, idx) => ({
      questionIndex: idx,
      selectedOptionIndex: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
      isCorrect: selectedAnswers[idx] === q.correctAnswerIndex,
    }));

    const correctCount = answersPayload.filter((a) => a.isCorrect).length;
    const totalCount = activeQuestions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    const wrongList = activeQuestions
      .map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter((q, idx) => selectedAnswers[idx] !== q.correctAnswerIndex);

    const summary = {
      score: correctCount,
      totalQuestions: totalCount,
      percentage,
      passed: percentage >= 70,
      answers: answersPayload,
      wrongQuestions: wrongList,
    };

    setScoreSummary(summary);
    setIsSubmitted(true);
    setAttemptSaved(false);

    // Only persist full-quiz attempts (skip skewed partial mistake-drill subsets)
    if (onSubmitAttempt && !isRetestingWrongOnly) {
      try {
        await onSubmitAttempt(answersPayload);
        setAttemptSaved(true);
      } catch (err) {
        console.error("Failed to record attempt:", err);
      }
    }

    setSubmitting(false);
  };

  // Re-test wrong answers
  const handleRetestWrong = () => {
    if (!scoreSummary || scoreSummary.wrongQuestions.length === 0) return;
    setActiveQuestions(scoreSummary.wrongQuestions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setIsRetestingWrongOnly(true);
    setScoreSummary(null);
  };

  const handleResetFull = () => {
    setActiveQuestions(questions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setIsRetestingWrongOnly(false);
    setScoreSummary(null);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white p-8 wobbly-border-sm hard-shadow-sm text-center">
        <p className="text-slate-500 font-hand text-xl">No quiz questions generated for this set.</p>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = activeQuestions.length > 0
    ? Math.round(((currentIndex + 1) / activeQuestions.length) * 100)
    : 0;

  return (
    <div className="w-full space-y-8">
      {/* Header and Mode Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-dashed border-slate-200 pb-4">
        <div className="rotate-1">
          <div className="inline-block px-4 py-1 bg-yellow-100 wobbly-border-sm text-sm font-bold mb-2">
            {isRetestingWrongOnly ? "Mode: Retesting Mistakes Drill" : "Mode: Single Choice Drills"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-hand">{title}</h2>
          <p className="text-lg text-slate-600 mt-1">
            Answer questions by clicking or using keys <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-800 text-xs font-mono font-bold shadow-sm">1</kbd> - <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-800 text-xs font-mono font-bold shadow-sm">4</kbd>
          </p>
        </div>

        {!isSubmitted && (
          <div className="text-right -rotate-1 self-end md:self-auto">
            <div className="text-3xl font-bold font-hand">
              Question {currentIndex + 1} <span className="text-slate-400">/ {activeQuestions.length}</span>
            </div>
            <div className="w-44 h-3 bg-slate-200 rounded-full mt-2 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Active Quiz Layout (Question + Options + Cheatsheet Sidebar) */}
      {!isSubmitted && currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Question Card */}
            <div className="bg-white p-8 wobbly-border hard-shadow relative">
              <div
                className="absolute -top-4 -left-4 w-12 h-12 bg-slate-800 text-white flex items-center justify-center font-bold text-xl rotate-[-12deg]"
                style={{ borderRadius: "50% 20% 50% 20%" }}
              >
                #{currentIndex + 1}
              </div>

              <div className="mb-8 mt-2">
                <h3 className="text-2xl font-bold leading-relaxed font-hand">
                  <FormattedContent text={currentQ.question} />
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full flex items-center gap-4 p-5 text-left border-2 border-slate-800 rounded-xl transition-all option-hover group ${isSelected
                          ? "bg-yellow-100 hard-shadow-sm -rotate-1"
                          : "bg-white hover:bg-yellow-50 active:translate-x-1 active:translate-y-1"
                        }`}
                    >
                      <span
                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-xl font-hand border border-slate-800 ${isSelected ? "bg-yellow-400" : "bg-slate-100 group-hover:bg-yellow-200"
                          }`}
                      >
                        {optIdx + 1}
                      </span>
                      <span className="text-xl font-hand leading-relaxed flex-1">
                        <FormattedContent text={option} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation and Submission Bar */}
            <div className="flex justify-between items-center bg-white p-4 wobbly-border-sm hard-shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-5 py-2 border-2 border-slate-300 text-slate-500 font-bold hover:text-slate-800 hover:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>

              {/* Question dots */}
              <div className="flex gap-2 items-center overflow-x-auto px-2">
                {activeQuestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-3.5 h-3.5 rounded-full transition-all border border-slate-800 ${currentIndex === i
                        ? "bg-yellow-400 scale-125"
                        : selectedAnswers[i] !== undefined
                          ? "bg-slate-800"
                          : "bg-slate-200 hover:bg-slate-300"
                      }`}
                    title={`Question ${i + 1}`}
                  />
                ))}
              </div>

              {currentIndex < activeQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(activeQuestions.length - 1, i + 1))}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white font-bold wobbly-border-sm hover:bg-slate-700 transition-all"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-7 py-2.5 bg-yellow-400 text-slate-900 font-bold wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <Award className="w-5 h-5" />
                  Submit Quiz
                </button>
              )}
            </div>

            {confirmingIncompleteSubmit && (
              <div className="bg-amber-50 border-2 border-amber-400 wobbly-border-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="font-hand text-base text-amber-950 font-bold">
                  You have answered {answeredCount} of {activeQuestions.length} questions. Submit anyway?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingIncompleteSubmit(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-hand font-bold text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Keep Answering
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-1.5 bg-yellow-400 border-2 border-slate-800 rounded-lg font-hand font-bold text-sm text-slate-900 hover:bg-yellow-300"
                  >
                    Submit Anyway
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Cheatsheet Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-yellow-50/80 p-6 wobbly-border-sm rotate-1 relative">
              <Info className="absolute -top-3 -right-3 w-8 h-8 text-yellow-600 rotate-12" />
              <h4 className="text-xl font-bold mb-3 font-hand">Quick Cheatsheet</h4>
              <ul className="space-y-2 text-slate-700 text-lg">
                <li>
                  <span className="font-bold">Keys 1-4:</span> Select option
                </li>
                <li>
                  <span className="font-bold">Arrow Keys:</span> Navigate questions
                </li>
                <li>
                  <span className="font-bold">Submit:</span> Evaluates and unlocks mistake review
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm -rotate-1">
              <h4 className="text-xl font-bold mb-4 font-hand">Current Session</h4>
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2 mb-2 text-lg">
                <span>Answered</span>
                <span className="font-bold">{answeredCount} / {activeQuestions.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2 mb-2 text-lg">
                <span>Remaining</span>
                <span className="font-bold text-slate-500">
                  {activeQuestions.length - answeredCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span>Total Questions</span>
                <span className="font-bold">{activeQuestions.length}</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Post-Submission Results & Re-test Mode */}
      {isSubmitted && scoreSummary && (
        <QuizResults
          scoreSummary={scoreSummary}
          activeQuestions={activeQuestions}
          selectedAnswers={selectedAnswers}
          isRetestingWrongOnly={isRetestingWrongOnly}
          attemptSaved={attemptSaved}
          onRetestWrong={handleRetestWrong}
          onResetFull={handleResetFull}
        />
      )}
    </div>
  );
}
