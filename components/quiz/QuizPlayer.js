"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Info,
} from "lucide-react";
import FormattedContent from "@/components/ui/FormattedContent";

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

  // Sync questions if prop changes and not submitted
  useEffect(() => {
    if (!isSubmitted && !isRetestingWrongOnly) {
      setActiveQuestions(questions);
      setSelectedAnswers({});
      setCurrentIndex(0);
    }
  }, [questions, isSubmitted, isRetestingWrongOnly]);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

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
  }, [currentIndex, activeQuestions.length, isSubmitted]);

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < activeQuestions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${Object.keys(selectedAnswers).length} of ${activeQuestions.length} questions. Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

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

    if (onSubmitAttempt) {
      try {
        await onSubmitAttempt(answersPayload);
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
                      className={`w-full flex items-center gap-4 p-5 text-left border-2 border-slate-800 rounded-xl transition-all option-hover group ${
                        isSelected
                          ? "bg-yellow-100 hard-shadow-sm -rotate-1"
                          : "bg-white hover:bg-yellow-50 active:translate-x-1 active:translate-y-1"
                      }`}
                    >
                      <span
                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-xl font-hand border border-slate-800 ${
                          isSelected ? "bg-yellow-400" : "bg-slate-100 group-hover:bg-yellow-200"
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
                    className={`w-3.5 h-3.5 rounded-full transition-all border border-slate-800 ${
                      currentIndex === i
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
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
          {/* Results Summary Card */}
          <div
            className={`bg-white p-8 wobbly-border hard-shadow text-center space-y-4 ${
              scoreSummary.passed ? "border-emerald-700" : "border-slate-800"
            }`}
          >
            <div className="inline-flex p-4 rounded-2xl bg-yellow-100 wobbly-border-sm rotate-3">
              <Award
                className={`w-10 h-10 ${scoreSummary.passed ? "text-emerald-700" : "text-yellow-600"}`}
              />
            </div>

            <div>
              <div className="text-6xl font-bold font-hand text-slate-900 tracking-tight">
                {scoreSummary.percentage}%
              </div>
              <p className="text-xl font-hand text-slate-700 mt-2">
                You scored {scoreSummary.score} out of {scoreSummary.totalQuestions} questions correct.
              </p>
            </div>

            <div className="inline-block px-4 py-1.5 bg-yellow-100 text-slate-900 font-bold text-base wobbly-border-sm">
              {scoreSummary.passed ? "Assessment Passed 🎉" : "Needs Review 📚"}
            </div>

            {/* Action Buttons: Retest wrong answers or restart */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t-2 border-dashed border-slate-200">
              {scoreSummary.wrongQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleRetestWrong}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-300 text-slate-900 font-bold font-hand text-xl wobbly-border-sm hard-shadow-sm hover:bg-yellow-200 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Re-test {scoreSummary.wrongQuestions.length} Mistake
                  {scoreSummary.wrongQuestions.length > 1 ? "s" : ""}
                </button>
              )}

              <button
                type="button"
                onClick={handleResetFull}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-800 font-bold font-hand text-xl wobbly-border-sm hard-shadow-sm hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Entire Quiz
              </button>
            </div>
          </div>

          {/* Breakdown of Each Question with Explanations */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-2">
              <h3 className="text-2xl font-bold font-hand tracking-wide">
                Detailed Question Review
              </h3>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {scoreSummary.wrongQuestions.length === 0 ? "Perfect Score!" : `${scoreSummary.wrongQuestions.length} to improve`}
              </span>
            </div>

            {activeQuestions.map((q, idx) => {
              const selectedOpt = selectedAnswers[idx];
              const isCorrect = selectedOpt === q.correctAnswerIndex;

              return (
                <div
                  key={idx}
                  className={`bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-4 ${
                    isCorrect ? "border-emerald-600" : "border-rose-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-xl font-bold font-hand text-slate-900 leading-snug">
                      <span className="text-slate-500 mr-2">#{idx + 1}</span>
                      <FormattedContent text={q.question} />
                    </h4>
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <XCircle className="w-7 h-7 text-rose-500" />
                      )}
                    </div>
                  </div>

                  {/* Options display */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.correctAnswerIndex;
                      const isOptionSelected = optIdx === selectedOpt;

                      let styleClass = "border-2 border-slate-200 bg-slate-50/50 text-slate-700";
                      if (isOptionCorrect) {
                        styleClass = "border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold";
                      } else if (isOptionSelected && !isOptionCorrect) {
                        styleClass = "border-2 border-rose-500 bg-rose-50 text-rose-900 line-through font-semibold";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-xl text-lg font-hand flex items-center justify-between gap-3 ${styleClass}`}
                        >
                          <div className="flex-1">
                            <FormattedContent text={opt} />
                          </div>
                          {isOptionCorrect && (
                            <span className="text-xs uppercase font-bold tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-600 flex-shrink-0">
                              Correct Answer
                            </span>
                          )}
                          {isOptionSelected && !isOptionCorrect && (
                            <span className="text-xs uppercase font-bold tracking-wider text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-500 flex-shrink-0">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Note */}
                  {q.explanation && (
                    <div className="p-4 rounded-xl bg-yellow-50/70 border-2 border-yellow-200 text-base font-hand text-slate-800 leading-relaxed flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-900 mr-1">Explanation:</span>
                        <FormattedContent text={q.explanation} className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
