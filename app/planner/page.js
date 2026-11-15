"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, AlertTriangle, Plus } from "lucide-react";
import { PlannerSkeleton } from "@/components/ui/Skeleton";
import PlannerStats from "@/components/planner/PlannerStats";
import WeeklySchedule from "@/components/planner/WeeklySchedule";
import ReviewRecommendations from "@/components/planner/ReviewRecommendations";
import FocusTimer from "@/components/planner/FocusTimer";
import ExamGoalsPanel from "@/components/planner/ExamGoalsPanel";

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

export default function PlannerPage() {
  const [overview, setOverview] = useState(null);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const showToast = (msg) => {
    setErrorMsg(null);
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadPlanner = useCallback(async () => {
    try {
      const [plannerJson, setsJson] = await Promise.all([
        requestJson("/api/planner", { cache: "no-store" }),
        requestJson("/api/study-sets", { cache: "no-store" }),
      ]);

      if (plannerJson.data) {
        setOverview(plannerJson.data);
        setSelectedDay((prev) => prev || plannerJson.data.todayStr);
      }
      if (setsJson.data) {
        setStudySets(setsJson.data);
      }
      setErrorMsg(null);
    } catch (err) {
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
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            allTasks: prev.allTasks.map((t) =>
              t.id === task.id ? { ...t, completed: nextCompleted } : t
            ),
          }
        : prev
    );

    try {
      await requestJson(`/api/checklist/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
      loadPlanner();
    }
  };

  const handleAddTask = async (payload) => {
    try {
      await requestJson("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadPlanner();
      return true;
    } catch (err) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const handleDeleteTask = async (id) => {
    setOverview((prev) =>
      prev
        ? { ...prev, allTasks: prev.allTasks.filter((t) => t.id !== id) }
        : prev
    );
    try {
      await requestJson(`/api/checklist/${id}`, { method: "DELETE" });
      await loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
      await loadPlanner();
    }
  };

  const handleMoveToToday = async (id) => {
    if (!overview?.todayStr) return;
    try {
      await requestJson(`/api/checklist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: overview.todayStr }),
      });
      loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRescheduleOverdue = async () => {
    try {
      const json = await requestJson("/api/planner/reschedule", { method: "POST" });
      await loadPlanner();
      if (overview?.todayStr) setSelectedDay(overview.todayStr);
      showToast(`Moved ${json.movedCount || 0} overdue tasks to Today!`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handlePlanWeakSetToday = async (weakSet) => {
    if (!overview?.todayStr) return;
    const ok = await handleAddTask({
      task: `Review "${weakSet.title}" (${weakSet.reasons[0] || "Weak area"})`,
      studySetId: weakSet.id,
      scheduledDate: overview.todayStr,
      priority: "high",
      estimatedMinutes: 20,
    });
    if (ok) {
      setSelectedDay(overview.todayStr);
      showToast(`Added "${weakSet.title}" review to Today's plan!`);
    }
  };

  const handleAddGoal = async (payload) => {
    try {
      await requestJson("/api/planner/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadPlanner();
      return true;
    } catch (err) {
      setErrorMsg(err.message);
      return false;
    }
  };

  const handleAutoBuildGoal = async (goalId) => {
    try {
      const json = await requestJson(`/api/planner/goals/${goalId}/schedule`, { method: "POST" });
      await loadPlanner();
      showToast(`Added ${json.data?.length || 0} study tasks to your calendar!`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleGoalComplete = async (goal) => {
    try {
      await requestJson(`/api/planner/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !goal.completed }),
      });
      await loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await requestJson(`/api/planner/goals/${goalId}`, { method: "DELETE" });
      loadPlanner();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return <PlannerSkeleton />;
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-slate-200 pb-4">
        <h1 className="text-3xl sm:text-4xl font-bold font-hand text-slate-900 flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-yellow-600" />
          Study Planner
        </h1>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-400 text-slate-900 font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
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

      {/* Summary Stats */}
      <PlannerStats stats={overview?.stats} />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5">
          <WeeklySchedule
            todayStr={overview?.todayStr}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            allTasks={overview?.allTasks || []}
            unscheduledCount={overview?.unscheduledTasks?.length || 0}
            studySets={studySets}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onMoveToToday={handleMoveToToday}
          />

          <ReviewRecommendations
            dueDecks={overview?.dueDecks || []}
            weakSets={overview?.weakSets || []}
            allTasks={overview?.allTasks || []}
            todayStr={overview?.todayStr}
            onPlanWeakSetToday={handlePlanWeakSetToday}
          />
        </div>

        <div className="space-y-5">
          <FocusTimer studySets={studySets} onSessionLogged={loadPlanner} />

          <ExamGoalsPanel
            goals={overview?.goals || []}
            allTasks={overview?.allTasks || []}
            studySets={studySets}
            onAddGoal={handleAddGoal}
            onAutoBuildGoal={handleAutoBuildGoal}
            onToggleGoalComplete={handleToggleGoalComplete}
            onDeleteGoal={handleDeleteGoal}
          />
        </div>
      </div>
    </div>
  );
}
