"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Square,
  Flame,
  Clock,
  Layers,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  Target,
  Wand2,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import FocusTimer from "@/components/planner/FocusTimer";

function buildWeekDays(todayStr) {
  const [y, m, d] = todayStr.split("-").map(Number);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
      dt.getUTCDate()
    ).padStart(2, "0")}`;
    const weekday = dt.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
    const dayNum = dt.getUTCDate();
    days.push({
      key,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekday,
      subLabel: `${weekday} ${dayNum}`,
    });
  }
  return days;
}

const PRIORITY_BADGE = {
  high: "bg-rose-100 text-rose-800 border-rose-400",
  medium: "bg-yellow-100 text-yellow-900 border-yellow-500",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

export default function PlannerPage() {
  const [overview, setOverview] = useState(null);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null); // YYYY-MM-DD or "backlog"

  // Add Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [taskSetId, setTaskSetId] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Add Goal Form State
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTopic, setGoalTopic] = useState("");
  const [goalExamDate, setGoalExamDate] = useState("");
  const [goalDailyMins, setGoalDailyMins] = useState(30);
  const [goalSetId, setGoalSetId] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [buildingGoalId, setBuildingGoalId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const showToast = (msg) => {
    setErrorMsg(null);
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadPlanner = useCallback(async () => {
    try {
      const [plannerRes, setsRes] = await Promise.all([
        fetch("/api/planner"),
        fetch("/api/study-sets"),
      ]);
      const plannerJson = await plannerRes.json();
      const setsJson = await setsRes.json();

      if (!plannerRes.ok) {
        throw new Error(plannerJson.error || "Failed to load planner");
      }

      if (plannerJson.data) {
        setOverview(plannerJson.data);
        setSelectedDay((prev) => prev || plannerJson.data.todayStr);
      }
      if (setsJson.data) {
        setStudySets(setsJson.data);
      }
      setErrorMsg(null);
    } catch (err) {
      console.error("Failed to load planner:", err);
      setErrorMsg(err.message || "Unable to load planner data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlanner();
  }, [loadPlanner]);

  const handleToggleTask = async (task) => {
    const nextCompleted = !task.completed;
    setOverview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        allTasks: prev.allTasks.map((t) =>
          t.id === task.id ? { ...t, completed: nextCompleted } : t
        ),
      };
    });

    try {
      await fetch(`/api/checklist/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      loadPlanner();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !overview) return;

    setAddingTask(true);
    const targetDate = selectedDay && selectedDay !== "backlog" ? selectedDay : overview.todayStr;
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: taskTitle.trim(),
          studySetId: taskSetId || null,
          scheduledDate: selectedDay === "backlog" ? null : targetDate,
          priority: taskPriority,
          estimatedMinutes: Number(taskMinutes) || 25,
        }),
      });
      if (res.ok) {
        setTaskTitle("");
        await loadPlanner();
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await fetch(`/api/checklist/${id}`, { method: "DELETE" });
      loadPlanner();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleMoveToToday = async (id) => {
    if (!overview) return;
    try {
      await fetch(`/api/checklist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: overview.todayStr }),
      });
      loadPlanner();
    } catch (err) {
      console.error("Failed to move task to today:", err);
    }
  };

  const handleRescheduleOverdue = async () => {
    try {
      const res = await fetch("/api/planner/reschedule", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reschedule tasks");
      await loadPlanner();
      if (overview?.todayStr) setSelectedDay(overview.todayStr);
      showToast(`Moved ${json.movedCount || 0} overdue tasks to Today!`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handlePlanWeakSetToday = async (weakSet) => {
    if (!overview) return;
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: `Review "${weakSet.title}" (${weakSet.reasons[0] || "Weak area"})`,
          studySetId: weakSet.id,
          scheduledDate: overview.todayStr,
          priority: "high",
          estimatedMinutes: 20,
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule review");
      await loadPlanner();
      setSelectedDay(overview.todayStr);
      showToast(`Added "${weakSet.title}" review to Today's plan!`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalExamDate) return;
    setSavingGoal(true);
    try {
      const linkedSet = studySets.find((s) => s.id === goalSetId);
      const res = await fetch("/api/planner/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle.trim(),
          topic: goalTopic.trim() || linkedSet?.topic || "General",
          studySetId: goalSetId || null,
          examDate: goalExamDate,
          dailyMinutes: Number(goalDailyMins) || 30,
        }),
      });
      if (res.ok) {
        setGoalTitle("");
        setGoalTopic("");
        setGoalExamDate("");
        setGoalSetId("");
        setShowGoalForm(false);
        await loadPlanner();
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleAutoBuildGoal = async (goalId) => {
    setBuildingGoalId(goalId);
    try {
      const res = await fetch(`/api/planner/goals/${goalId}/schedule`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate exam schedule");
      await loadPlanner();
      showToast(`Added ${json.data?.length || 0} study tasks to your calendar!`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBuildingGoalId(null);
    }
  };

  const handleToggleGoalComplete = async (goal) => {
    try {
      const res = await fetch(`/api/planner/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !goal.completed }),
      });
      if (!res.ok) throw new Error("Failed to update goal status");
      await loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await fetch(`/api/planner/goals/${goalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
      loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 bg-yellow-300 flex items-center justify-center rounded-2xl border-2 border-slate-800 mx-auto animate-spin">
          <Sparkles className="w-6 h-6 text-slate-800" />
        </div>
        <p className="text-xl font-hand text-slate-600">Loading your study planner...</p>
      </div>
    );
  }

  const todayStr = overview?.todayStr;
  const weekDays = todayStr ? buildWeekDays(todayStr) : [];
  const allTasks = overview?.allTasks || [];
  const activeDay = selectedDay || todayStr;

  const visibleTasks =
    activeDay === "backlog"
      ? allTasks.filter((t) => !t.scheduled_date && !t.completed)
      : allTasks.filter((t) => t.scheduled_date === activeDay);

  const visibleMinutes = visibleTasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + Number(t.estimated_minutes || 20), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-dashed border-slate-200 pb-6">
        <div className="rotate-[-0.5deg]">
          <div className="inline-block px-3 py-1 bg-yellow-100 wobbly-border-sm text-xs font-bold uppercase mb-2">
            Daily Schedule &bull; Spaced Review &bull; Exam Goals
          </div>
          <h1 className="text-4xl font-bold font-hand text-slate-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-yellow-600" />
            My Study Planner
          </h1>
          <p className="text-lg text-slate-600 font-hand mt-1">
            Plan your week, clear due flashcards, and stay ahead of upcoming exams.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-slate-900 font-bold font-hand text-xl wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          New Study Set
        </Link>
      </div>

      {/* Feedback & Error Banners */}
      {feedback && (
        <div className="p-3.5 bg-emerald-100 border-2 border-emerald-700 rounded-xl font-hand font-bold text-emerald-900 text-lg">
          ✓ {feedback}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl font-hand font-bold text-rose-800 text-lg flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-sm underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 wobbly-border-sm hard-shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 bg-yellow-200 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#2d2d2d]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-hand text-slate-900">
              {overview?.stats?.todayDone || 0} / {overview?.stats?.todayTotal || 0}
            </div>
            <div className="text-xs uppercase font-bold text-slate-500">Today&apos;s Tasks</div>
          </div>
        </div>

        <div className="bg-white p-4 wobbly-border-sm hard-shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-100 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-[#2d2d2d]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-hand text-slate-900">
              {overview?.stats?.totalDueCards || 0} Due
            </div>
            <div className="text-xs uppercase font-bold text-slate-500">SM-2 Flashcards</div>
          </div>
        </div>

        <div className="bg-white p-4 wobbly-border-sm hard-shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-100 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="text-2xl font-bold font-hand text-slate-900">
              {overview?.stats?.streak || 0} {overview?.stats?.streak === 1 ? "Day" : "Days"}
            </div>
            <div className="text-xs uppercase font-bold text-slate-500">Study Streak</div>
          </div>
        </div>

        <div className="bg-white p-4 wobbly-border-sm hard-shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-100 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl font-bold font-hand text-slate-900">
              {overview?.stats?.minutesToday || 0}m
            </div>
            <div className="text-xs uppercase font-bold text-slate-500">
              Today ({overview?.stats?.minutesWeek || 0}m / wk)
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overview?.stats?.overdueCount > 0 && (
        <div className="bg-rose-50 p-4 wobbly-border-sm hard-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-lg font-hand font-bold text-rose-900">
              You have {overview.stats.overdueCount} unfinished{" "}
              {overview.stats.overdueCount === 1 ? "task" : "tasks"} from earlier days.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRescheduleOverdue}
            className="px-4 py-2 bg-white hover:bg-yellow-100 border-2 border-[#2d2d2d] rounded-xl font-bold font-hand text-base text-slate-900 transition-all self-start sm:self-auto"
          >
            Reschedule All to Today
          </button>
        </div>
      )}

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN (2/3): Weekly Strip, Daily Tasks, Due Decks, Weak Sets */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weekly Schedule Card */}
          <section className="bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-slate-200 pb-3">
              <h2 className="text-2xl font-bold font-hand text-slate-900">
                Weekly Study Schedule
              </h2>
              <span className="text-sm font-bold font-hand text-slate-500">
                {visibleTasks.filter((t) => !t.completed).length} remaining &bull; ~{visibleMinutes}m
              </span>
            </div>

            {/* 7-Day Selector Strip + Backlog */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {weekDays.map((day) => {
                const dayTasks = allTasks.filter((t) => t.scheduled_date === day.key);
                const openCount = dayTasks.filter((t) => !t.completed).length;
                const isSelected = activeDay === day.key;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDay(day.key)}
                    className={`px-3.5 py-2 rounded-xl border-2 text-left transition-all flex-shrink-0 min-w-[92px] ${
                      isSelected
                        ? "bg-yellow-300 border-[#2d2d2d] hard-shadow-sm -rotate-1"
                        : "bg-slate-50 border-slate-200 hover:bg-yellow-50"
                    }`}
                  >
                    <div className="text-sm font-bold font-hand text-slate-900">{day.label}</div>
                    <div className="text-xs font-hand text-slate-500">{day.subLabel}</div>
                    <div className="mt-1 text-xs font-bold font-mono text-slate-700">
                      {openCount > 0 ? `${openCount} due` : dayTasks.length > 0 ? "All done" : "Free"}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedDay("backlog")}
                className={`px-3.5 py-2 rounded-xl border-2 text-left transition-all flex-shrink-0 min-w-[92px] ${
                  activeDay === "backlog"
                    ? "bg-yellow-300 border-[#2d2d2d] hard-shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:bg-yellow-50"
                }`}
              >
                <div className="text-sm font-bold font-hand text-slate-900">Backlog</div>
                <div className="text-xs font-hand text-slate-500">Unscheduled</div>
                <div className="mt-1 text-xs font-bold font-mono text-slate-700">
                  {overview?.unscheduledTasks?.length || 0} open
                </div>
              </button>
            </div>

            {/* Tasks for Selected Day */}
            <div className="space-y-2.5">
              {visibleTasks.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-lg font-hand text-slate-400">
                    {activeDay === "backlog"
                      ? "No unscheduled backlog tasks."
                      : "Nothing scheduled for this day yet. Add a task below or auto-build an exam plan!"}
                  </p>
                </div>
              ) : (
                visibleTasks.map((task) => {
                  const prio = task.priority || "medium";
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-all ${
                        task.completed
                          ? "bg-slate-50 border-slate-200 text-slate-400"
                          : "bg-white border-slate-800 hover:bg-yellow-50/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task)}
                        className="flex items-start gap-3 text-left flex-1 group"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 group-hover:text-yellow-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="space-y-1">
                          <span
                            className={`block text-lg font-hand leading-snug ${
                              task.completed ? "line-through text-slate-400" : "text-slate-900 font-semibold"
                            }`}
                          >
                            {task.task}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-hand">
                            <span
                              className={`px-2 py-0.5 rounded border font-bold uppercase ${
                                PRIORITY_BADGE[prio] || PRIORITY_BADGE.medium
                              }`}
                            >
                              {prio}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600 font-bold">
                              {task.estimated_minutes || 20}m
                            </span>
                            {task.study_set_id && task.study_set_title && (
                              <Link
                                href={`/study/${task.study_set_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-0.5 rounded bg-yellow-100 border border-yellow-400 text-yellow-900 font-bold hover:underline"
                              >
                                {task.study_set_title} →
                              </Link>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {activeDay !== todayStr && !task.completed && (
                          <button
                            type="button"
                            onClick={() => handleMoveToToday(task.id)}
                            className="px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 border border-[#2d2d2d] rounded-lg text-xs font-bold font-hand text-slate-800"
                          >
                            → Today
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Task Form */}
            <form
              onSubmit={handleAddTask}
              className="pt-4 border-t-2 border-dashed border-slate-200 space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={
                    activeDay === "backlog"
                      ? "Add unscheduled study task..."
                      : `Add study task for ${
                          activeDay === todayStr ? "Today" : activeDay
                        }...`
                  }
                  className="flex-1 px-4 py-2.5 bg-white wobbly-border-sm font-hand text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  disabled={!taskTitle.trim() || addingTask}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm disabled:opacity-40 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm font-hand">
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <select
                  value={taskMinutes}
                  onChange={(e) => setTaskMinutes(Number(e.target.value))}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700"
                >
                  <option value={15}>15 min</option>
                  <option value={25}>25 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>

                {studySets.length > 0 && (
                  <select
                    value={taskSetId}
                    onChange={(e) => setTaskSetId(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-700 max-w-[220px]"
                  >
                    <option value="">No linked study set</option>
                    {studySets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </form>
          </section>

          {/* Due Flashcard Reviews + Needs Attention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Due Flashcards */}
            <section className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-2.5">
                <h3 className="text-xl font-bold font-hand text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-yellow-600" />
                  Due Flashcard Reviews
                </h3>
              </div>

              {(overview?.dueDecks || []).length === 0 ? (
                <p className="text-base font-hand text-slate-500 py-4">
                  All caught up! Study any deck in{" "}
                  <Link href="/flashcards" className="text-yellow-700 font-bold underline">
                    Flashcards
                  </Link>{" "}
                  to build your SM-2 review queue.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {overview.dueDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="p-3 rounded-xl border-2 border-slate-200 bg-yellow-50/40 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold font-hand text-slate-900 truncate">
                          {deck.title}
                        </div>
                        <div className="text-xs font-hand text-slate-600">
                          {deck.dueCount} due today &bull; {deck.learningCount} learning
                        </div>
                      </div>
                      <Link
                        href={`/flashcards?setId=${deck.id}&filter=${
                          deck.dueCount > 0 ? "due" : "learning"
                        }`}
                        className="px-3 py-1.5 bg-yellow-300 hover:bg-yellow-400 border border-[#2d2d2d] rounded-lg text-sm font-bold font-hand text-slate-900 flex-shrink-0 inline-flex items-center gap-1"
                      >
                        Review <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Weak Areas / Needs Attention */}
            <section className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-2.5">
                <h3 className="text-xl font-bold font-hand text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-rose-500" />
                  Needs Attention
                </h3>
              </div>

              {(overview?.weakSets || []).length === 0 ? (
                <p className="text-base font-hand text-slate-500 py-4">
                  No weak study sets flagged right now. Keep taking quizzes and rating cards!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {overview.weakSets.map((ws) => {
                    const alreadyPlannedToday = allTasks.some(
                      (t) =>
                        !t.completed &&
                        t.scheduled_date === todayStr &&
                        t.study_set_id === ws.id
                    );

                    return (
                      <div
                        key={ws.id}
                        className="p-3 rounded-xl border-2 border-slate-200 bg-rose-50/40 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/study/${ws.id}`}
                            className="font-bold font-hand text-slate-900 hover:underline block truncate"
                          >
                            {ws.title}
                          </Link>
                          <div className="text-xs font-hand text-rose-700 font-bold">
                            {ws.reasons.join(" • ")}
                          </div>
                        </div>
                        {alreadyPlannedToday ? (
                          <span className="px-3 py-1.5 bg-emerald-100 border border-emerald-600 rounded-lg text-xs font-bold font-hand text-emerald-900 flex-shrink-0">
                            Planned Today ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePlanWeakSetToday(ws)}
                            className="px-3 py-1.5 bg-white hover:bg-yellow-100 border border-[#2d2d2d] rounded-lg text-sm font-bold font-hand text-slate-900 flex-shrink-0"
                          >
                            + Plan Today
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3): Focus Timer & Exam Countdowns */}
        <div className="space-y-6">
          <FocusTimer studySets={studySets} onSessionLogged={loadPlanner} />

          {/* Exam & Goal Countdowns */}
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
                onSubmit={handleAddGoal}
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

            {(overview?.goals || []).length === 0 ? (
              <p className="text-base font-hand text-slate-500 py-2">
                Add an upcoming exam or deadline to track countdowns and auto-generate a study plan.
              </p>
            ) : (
              <div className="space-y-3">
                {overview.goals.map((goal) => {
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
                            onClick={() => handleAutoBuildGoal(goal.id)}
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
                          onClick={() => handleToggleGoalComplete(goal)}
                          className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 rounded-lg text-xs font-bold font-hand text-slate-700"
                          title={goal.completed ? "Reopen goal" : "Mark completed"}
                        >
                          {goal.completed ? "Reopen" : "Done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id)}
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
        </div>
      </div>
    </div>
  );
}

