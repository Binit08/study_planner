"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, Wand2, Trash2 } from "lucide-react";

/**
 * Exam countdowns, readiness progress bars, and 1-click study schedule builder.
 */
export default function ExamGoalsPanel({
  goals = [],
  allTasks = [],
  studySets = [],
  onAddGoal,
  onAutoBuildGoal,
  onToggleGoalComplete,
  onDeleteGoal,
}) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalExamDate, setGoalExamDate] = useState("");
  const [goalDailyMins, setGoalDailyMins] = useState(30);
  const [goalSetId, setGoalSetId] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [buildingGoalId, setBuildingGoalId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalExamDate) return;
    setSavingGoal(true);
    try {
      const linkedSet = studySets.find((s) => s.id === goalSetId);
      const ok = await onAddGoal({
        title: goalTitle.trim(),
        topic: linkedSet?.topic || "General",
        studySetId: goalSetId || null,
        examDate: goalExamDate,
        dailyMinutes: Number(goalDailyMins) || 30,
      });
      if (ok) {
        setGoalTitle("");
        setGoalExamDate("");
        setGoalSetId("");
        setShowGoalForm(false);
      }
    } finally {
      setSavingGoal(false);
    }
  };

  const handleAutoBuild = async (goalId) => {
    setBuildingGoalId(goalId);
    try {
      await onAutoBuildGoal(goalId);
    } finally {
      setBuildingGoalId(null);
    }
  };

  return (
    <section className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-300 border border-[#2d2d2d] rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-[#2d2d2d]" />
          </div>
          <h3 className="text-xl font-bold font-hand text-slate-900">Exams &amp; Goals</h3>
        </div>

        <button
          type="button"
          onClick={() => setShowGoalForm((prev) => !prev)}
          className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 border border-[#2d2d2d] rounded-lg text-sm font-bold font-hand"
        >
          {showGoalForm ? "Cancel" : "+ Add Exam"}
        </button>
      </div>

      {showGoalForm && (
        <form
          onSubmit={handleSubmit}
          className="p-3.5 bg-yellow-50/70 rounded-xl border-2 border-[#2d2d2d] space-y-2.5"
        >
          <input
            type="text"
            required
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g., Operating Systems Midterm"
            className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-lg font-hand text-base focus:outline-none focus:border-[#2d2d2d]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              required
              value={goalExamDate}
              onChange={(e) => setGoalExamDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border-2 border-slate-300 rounded-lg font-hand text-sm"
            />
            <select
              value={goalDailyMins}
              onChange={(e) => setGoalDailyMins(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-white border-2 border-slate-300 rounded-lg font-hand text-sm font-bold"
            >
              <option value={20}>20m / day</option>
              <option value={30}>30m / day</option>
              <option value={45}>45m / day</option>
              <option value={60}>60m / day</option>
            </select>
          </div>
          {studySets.length > 0 && (
            <select
              value={goalSetId}
              onChange={(e) => setGoalSetId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border-2 border-slate-300 rounded-lg font-hand text-sm"
            >
              <option value="">Link a study set (optional)</option>
              {studySets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={savingGoal}
            className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-[#2d2d2d] rounded-lg font-bold font-hand text-base text-slate-900"
          >
            {savingGoal ? "Saving..." : "Save Exam Goal"}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-base font-hand text-slate-500 py-2">
          Add an upcoming exam or deadline to track countdowns and auto-generate a study plan.
        </p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const countdownText = goal.completed
              ? "Completed"
              : goal.daysLeft < 0
              ? "Past due"
              : goal.daysLeft === 0
              ? "Today!"
              : `${goal.daysLeft}d left`;

            const hasBuiltPlan = allTasks.some(
              (t) =>
                t.due_date === goal.exam_date &&
                (!goal.study_set_id || t.study_set_id === goal.study_set_id)
            );

            return (
              <div
                key={goal.id}
                className={`p-3.5 rounded-xl border-2 space-y-2.5 ${
                  goal.completed
                    ? "border-slate-300 bg-slate-50 opacity-75"
                    : "border-[#2d2d2d] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={`font-bold font-hand text-lg leading-tight ${
                        goal.completed ? "line-through text-slate-500" : "text-slate-900"
                      }`}
                    >
                      {goal.title}
                    </h4>
                    <div className="text-xs font-hand text-slate-500 flex flex-wrap items-center gap-2">
                      <span>
                        {goal.exam_date} &bull; {goal.daily_minutes}m/day
                      </span>
                      {goal.study_set_id && goal.study_set_title && (
                        <Link
                          href={`/study/${goal.study_set_id}`}
                          className="text-yellow-700 font-bold hover:underline"
                        >
                          {goal.study_set_title} →
                        </Link>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono border flex-shrink-0 ${
                      goal.completed
                        ? "bg-emerald-100 text-emerald-800 border-emerald-500"
                        : goal.daysLeft <= 2
                        ? "bg-rose-100 text-rose-800 border-rose-400"
                        : "bg-yellow-100 text-yellow-900 border-yellow-500"
                    }`}
                  >
                    {countdownText}
                  </span>
                </div>

                {/* Readiness Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold font-hand text-slate-600">
                    <span>Readiness</span>
                    <span>{goal.readinessPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-400">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${goal.readinessPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {!goal.completed && (
                    <button
                      type="button"
                      disabled={buildingGoalId === goal.id || hasBuiltPlan}
                      onClick={() => handleAutoBuild(goal.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-yellow-200 hover:bg-yellow-300 border border-[#2d2d2d] rounded-lg text-sm font-bold font-hand text-slate-900 disabled:opacity-60"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {buildingGoalId === goal.id
                        ? "Building..."
                        : hasBuiltPlan
                        ? "Plan Built ✓"
                        : "Auto-Build Plan"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleGoalComplete(goal)}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 rounded-lg text-xs font-bold font-hand text-slate-700"
                    title={goal.completed ? "Reopen goal" : "Mark completed"}
                  >
                    {goal.completed ? "Reopen" : "Done"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

