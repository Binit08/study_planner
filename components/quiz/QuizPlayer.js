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
    <div className="w-full space-y-4">
      {/* Header and Mode Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b-2 border-dashed border-slate-200 pb-3">
        <div>
          {isRetestingWrongOnly && (
            <div className="inline-block px-3 py-0.5 bg-yellow-100 wobbly-border-sm text-xs font-bold mb-1">
              Retesting Mistakes
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold font-hand">{title}</h2>
        </div>

        {!isSubmitted && (
          <div className="text-left sm:text-right self-stretch sm:self-auto flex sm:block items-center justify-between gap-3">
            <div className="text-xl sm:text-2xl font-bold font-hand">
              Question {currentIndex + 1} <span className="text-slate-400">/ {activeQuestions.length}</span>
            </div>
            <div className="w-36 h-2.5 bg-slate-200 rounded-full sm:mt-1 overflow-hidden border border-slate-800">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-3.5">
            {/* Question Card */}
            <div className="bg-white p-4 sm:p-5 wobbly-border hard-shadow relative">
              <div
                className="absolute -top-3 -left-2 w-8 h-8 sm:w-9 sm:h-9 bg-slate-800 text-white flex items-center justify-center font-bold text-sm sm:text-base rotate-[-12deg]"
                style={{ borderRadius: "50% 20% 50% 20%" }}
              >
                #{currentIndex + 1}
              </div>

              <div className="mb-3.5 mt-1">
                <h3 className="text-lg sm:text-xl font-bold leading-snug font-hand">
                  <FormattedContent text={currentQ.question} />
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full flex items-center gap-3 p-2.5 sm:p-3 text-left border-2 border-slate-800 rounded-xl transition-all option-hover group ${isSelected
                          ? "bg-yellow-100 hard-shadow-sm"
                          : "bg-white hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5"
                        }`}
                    >
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-base font-hand border border-slate-800 ${isSelected ? "bg-yellow-400" : "bg-slate-100 group-hover:bg-yellow-200"
                          }`}
                      >
                        {optIdx + 1}
                      </span>
                      <span className="text-base sm:text-lg font-hand leading-snug flex-1">
                        <FormattedContent text={option} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation and Submission Bar */}
            <div className="flex flex-wrap justify-between items-center gap-2 bg-white p-2.5 sm:p-3 wobbly-border-sm hard-shadow-sm">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-slate-300 text-slate-600 font-bold text-sm sm:text-base hover:text-slate-800 hover:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
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
          <aside className="lg:col-span-4 space-y-4">
            <div className="hidden lg:block bg-yellow-50/80 p-4 wobbly-border-sm relative">
              <Info className="absolute -top-2.5 -right-2.5 w-6 h-6 text-yellow-600" />
              <h4 className="text-lg font-bold mb-2 font-hand">Shortcuts</h4>
              <ul className="space-y-1 text-slate-700 text-sm font-hand">
                <li>
                  <span className="font-bold">1-4:</span> Select option
                </li>
                <li>
                  <span className="font-bold">Arrows:</span> Next / Prev
                </li>
              </ul>
            </div>

            <div className="bg-white p-4 wobbly-border-sm hard-shadow-sm">
              <h4 className="text-lg font-bold mb-2 font-hand">Session</h4>
              <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1.5 mb-1.5 text-base">
                <span>Answered</span>
                <span className="font-bold">{answeredCount} / {activeQuestions.length}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span>Remaining</span>
                <span className="font-bold text-slate-500">
                  {activeQuestions.length - answeredCount}
                </span>
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
