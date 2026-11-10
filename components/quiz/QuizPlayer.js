"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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

  // Keyboard navigation for options (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
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

  // Re-test wrong answers requirement
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
      <Card className="text-center py-12">
        <p className="text-text-secondary text-sm">No quiz questions generated for this set.</p>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header and Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h2>
            {isRetestingWrongOnly && (
              <Badge variant="amber" size="xs">
                Re-testing Mistakes
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-tertiary">
            Answer questions by clicking or using keys <kbd className="px-1 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">1</kbd>-<kbd className="px-1 py-0.5 rounded bg-surface border border-border-subtle text-[10px]">4</kbd>
          </p>
        </div>

        {!isSubmitted && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-secondary">
              Question {currentIndex + 1} of {activeQuestions.length}
            </span>
          </div>
        )}
      </div>

      {/* Quiz Body */}
      {!isSubmitted && currentQ && (
        <div className="space-y-6">
          {/* Question Card */}
          <Card className="bg-surface/60 backdrop-blur-xl border-border-subtle p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface text-accent-sky font-semibold text-xs border border-border-translucent">
                Q{currentIndex + 1}
              </span>
              <span className="text-xs text-text-tertiary">Single Choice</span>
            </div>

            <div className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
              <FormattedContent text={currentQ.question} />
            </div>
          </Card>

          {/* Options List */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 group ${
                    isSelected
                      ? "bg-accent-blue/15 border-accent-blue text-text-primary shadow-sm"
                      : "bg-surface-translucent border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-translucent hover:bg-surface-hover"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-medium border transition-colors ${
                      isSelected
                        ? "bg-accent-blue text-black border-accent-blue"
                        : "bg-surface text-text-tertiary border-border-subtle group-hover:border-text-secondary"
                    }`}
                  >
                    {optIdx + 1}
                  </span>
                  <div className="text-sm leading-relaxed flex-1">
                    <FormattedContent text={option} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation and Submission Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {activeQuestions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentIndex === i
                      ? "bg-accent-sky scale-125"
                      : selectedAnswers[i] !== undefined
                      ? "bg-emerald-400/80"
                      : "bg-zinc-700 hover:bg-zinc-600"
                  }`}
                />
              ))}
            </div>

            {currentIndex < activeQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(activeQuestions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-primary hover:bg-surface-hover transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-accent-amber to-accent-sky text-black hover:opacity-90 transition-all shadow-md"
              >
                <Award className="w-4 h-4" />
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post-Submission Results & Re-test Mode */}
      {isSubmitted && scoreSummary && (
        <div className="space-y-6 animate-fade-in">
          {/* Results Summary Hero Card */}
          <Card
            className={`text-center py-8 px-6 space-y-4 border ${
              scoreSummary.passed ? "border-emerald-500/30 bg-emerald-950/10" : "border-amber-500/30 bg-amber-950/10"
            }`}
          >
            <div className="inline-flex p-3 rounded-2xl bg-surface border border-border-translucent">
              <Award
                className={`w-8 h-8 ${scoreSummary.passed ? "text-emerald-400" : "text-amber-400"}`}
              />
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-tight text-text-primary">
                {scoreSummary.percentage}%
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                You scored {scoreSummary.score} out of {scoreSummary.totalQuestions} questions correct.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Badge variant={scoreSummary.passed ? "mastered" : "learning"} size="md">
                {scoreSummary.passed ? "Assessment Passed" : "Needs Review"}
              </Badge>
            </div>

            {/* Action Buttons: Retest wrong answers or restart */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-border-subtle/50">
              {scoreSummary.wrongQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleRetestWrong}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-test {scoreSummary.wrongQuestions.length} Mistake
                  {scoreSummary.wrongQuestions.length > 1 ? "s" : ""}
                </button>
              )}

              <button
                type="button"
                onClick={handleResetFull}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-surface border border-border-subtle text-text-primary hover:bg-surface-hover transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Entire Quiz
              </button>
            </div>
          </Card>

          {/* Breakdown of Each Question with Explanations */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wide uppercase text-text-tertiary">
              Detailed Question Review
            </h4>

            {activeQuestions.map((q, idx) => {
              const selectedOpt = selectedAnswers[idx];
              const isCorrect = selectedOpt === q.correctAnswerIndex;

              return (
                <Card
                  key={idx}
                  className={`p-5 space-y-3 border ${
                    isCorrect ? "border-emerald-500/30 bg-emerald-950/5" : "border-rose-500/30 bg-rose-950/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-text-primary leading-snug">
                      <span className="text-text-tertiary mr-2 font-mono">#{idx + 1}</span>
                      {q.question}
                    </p>
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Options display */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.correctAnswerIndex;
                      const isOptionSelected = optIdx === selectedOpt;

                      let styleClass = "border-border-subtle bg-surface/40 text-text-tertiary";
                      if (isOptionCorrect) {
                        styleClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 font-medium";
                      } else if (isOptionSelected && !isOptionCorrect) {
                        styleClass = "border-rose-500/50 bg-rose-500/10 text-rose-200 line-through";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`px-3 py-2 rounded-lg text-xs border flex items-center justify-between gap-3 ${styleClass}`}
                        >
                          <div className="flex-1">
                            <FormattedContent text={opt} />
                          </div>
                          {isOptionCorrect && (
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 flex-shrink-0">
                              Correct Answer
                            </span>
                          )}
                          {isOptionSelected && !isOptionCorrect && (
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-rose-400 flex-shrink-0">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Note */}
                  {q.explanation && (
                    <div className="p-3 rounded-lg bg-surface/60 border border-border-subtle text-xs text-text-secondary leading-relaxed flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-accent-sky flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold text-text-primary mr-1">Explanation:</span>
                        <FormattedContent text={q.explanation} className="mt-1" />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
