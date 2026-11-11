"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Square, Plus, Trash2 } from "lucide-react";

const PRIORITY_BADGE = {
  high: "bg-rose-100 text-rose-800 border-rose-400",
  medium: "bg-yellow-100 text-yellow-900 border-yellow-500",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

function buildWeekDays(todayStr) {
  const [y, m, d] = todayStr.split("-").map(Number);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
      dt.getUTCDate()
    ).padStart(2, "0")}`;
    const weekday = dt.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
    days.push({
      key,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekday,
      subLabel: `${weekday} ${dt.getUTCDate()}`,
    });
  }
  return days;
}

/**
 * 7-day study schedule strip, daily task list, and inline task creator.
 */
export default function WeeklySchedule({
  todayStr,
  selectedDay,
  onSelectDay,
  allTasks = [],
  unscheduledCount = 0,
  studySets = [],
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onMoveToToday,
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [taskSetId, setTaskSetId] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const weekDays = todayStr ? buildWeekDays(todayStr) : [];
  const activeDay = selectedDay || todayStr;

  const visibleTasks =
    activeDay === "backlog"
      ? allTasks.filter((t) => !t.scheduled_date && !t.completed)
      : allTasks.filter((t) => t.scheduled_date === activeDay);

  const visibleMinutes = visibleTasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + Number(t.estimated_minutes || 20), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setAddingTask(true);
    try {
      const ok = await onAddTask({
        task: taskTitle.trim(),
        studySetId: taskSetId || null,
        scheduledDate: activeDay === "backlog" ? null : activeDay,
        priority: taskPriority,
        estimatedMinutes: Number(taskMinutes) || 25,
      });
      if (ok) setTaskTitle("");
    } finally {
      setAddingTask(false);
    }
  };

  return (
    <section className="bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-slate-200 pb-3">
        <h2 className="text-2xl font-bold font-hand text-slate-900">Weekly Study Schedule</h2>
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
              onClick={() => onSelectDay(day.key)}
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
          onClick={() => onSelectDay("backlog")}
          className={`px-3.5 py-2 rounded-xl border-2 text-left transition-all flex-shrink-0 min-w-[92px] ${
            activeDay === "backlog"
              ? "bg-yellow-300 border-[#2d2d2d] hard-shadow-sm"
              : "bg-slate-50 border-slate-200 hover:bg-yellow-50"
          }`}
        >
          <div className="text-sm font-bold font-hand text-slate-900">Backlog</div>
          <div className="text-xs font-hand text-slate-500">Unscheduled</div>
          <div className="mt-1 text-xs font-bold font-mono text-slate-700">
            {unscheduledCount} open
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
                  onClick={() => onToggleTask(task)}
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
                      onClick={() => onMoveToToday(task.id)}
                      className="px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 border border-[#2d2d2d] rounded-lg text-xs font-bold font-hand text-slate-800"
                    >
                      → Today
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
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
        onSubmit={handleSubmit}
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
                : `Add study task for ${activeDay === todayStr ? "Today" : activeDay}...`
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
  );
}

