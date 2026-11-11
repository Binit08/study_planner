"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, Calendar, Clock } from "lucide-react";

const PRIORITY_STYLES = {
  high: "bg-rose-100 text-rose-800 border-rose-400",
  medium: "bg-yellow-100 text-yellow-900 border-yellow-500",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

export default function StudyChecklist({
  items = [],
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onScheduleToday,
  showScheduleControls = false,
  title = "Actionable Study Plan",
}) {
  const [newTask, setNewTask] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState(20);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim() || !onAddItem) return;

    if (showScheduleControls) {
      onAddItem({
        task: newTask.trim(),
        scheduledDate: scheduledDate || null,
        priority,
        estimatedMinutes: Number(estimatedMinutes) || 20,
      });
    } else {
      onAddItem(newTask.trim());
    }

    setNewTask("");
  };

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="bg-white p-6 md:p-8 wobbly-border-sm hard-shadow-sm space-y-6 relative rotate-[-0.5deg]">
      {/* Tape effect at the top */}
      <div className="tape-effect" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-300 flex items-center justify-center rounded-lg border border-slate-800">
            <CheckSquare className="w-5 h-5 text-slate-800" />
          </div>
          <h3 className="text-2xl font-bold font-hand text-slate-900 tracking-tight">{title}</h3>
        </div>
        <div className="inline-block px-3 py-1 bg-yellow-100 wobbly-border-sm text-sm font-bold self-start sm:self-auto">
          {completedCount} / {items.length} Done ({percentage}%)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const itemId = item.id || idx;
          const dateLabel = item.scheduled_date || item.scheduledDate;
          const minsLabel = item.estimated_minutes || item.estimatedMinutes;
          const prio = item.priority || "medium";

          return (
            <div
              key={itemId}
              className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                item.completed
                  ? "bg-slate-50 border-slate-200 text-slate-400"
                  : "bg-white border-slate-800 text-slate-800 hover:bg-yellow-50/50"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleItem && onToggleItem(itemId, !item.completed)}
                className="flex items-start gap-3 text-left flex-1 group"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 group-hover:text-yellow-600 flex-shrink-0 mt-1" />
                )}
                <div className="space-y-1">
                  <span
                    className={`block text-lg font-hand leading-relaxed ${
                      item.completed ? "line-through text-slate-400" : "text-slate-800 font-semibold"
                    }`}
                  >
                    {item.task}
                  </span>

                  {(dateLabel || minsLabel || item.priority) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-hand">
                      {item.priority && (
                        <span
                          className={`px-2 py-0.5 rounded border font-bold uppercase ${
                            PRIORITY_STYLES[prio] || PRIORITY_STYLES.medium
                          }`}
                        >
                          {prio}
                        </span>
                      )}
                      {minsLabel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600 font-bold">
                          <Clock className="w-3 h-3" />
                          {minsLabel}m
                        </span>
                      )}
                      {dateLabel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-300 text-blue-800 font-bold">
                          <Calendar className="w-3 h-3" />
                          {dateLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1">
                {onScheduleToday && !dateLabel && !item.completed && typeof item.id === "string" && (
                  <button
                    type="button"
                    onClick={() => onScheduleToday(item.id)}
                    className="px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 border border-slate-800 rounded-lg text-xs font-bold font-hand text-slate-800 transition-colors"
                    title="Add to Today's Planner"
                  >
                    + Today
                  </button>
                )}

                {onDeleteItem && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(itemId)}
                    className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"
                    title="Remove goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-400 font-hand text-lg">
              No checkpoints added yet. Add your first study goal below!
            </p>
          </div>
        )}
      </div>

      {/* Add New Task Form */}
      {onAddItem && (
        <form onSubmit={handleAdd} className="space-y-3 pt-4 border-t-2 border-dashed border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add new study goal or checkpoint..."
              className="flex-1 px-4 py-2.5 bg-white wobbly-border-sm font-hand text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-yellow-400 text-slate-900 font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 disabled:opacity-40 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>

          {showScheduleControls && (
            <div className="flex flex-wrap items-center gap-2 text-sm font-hand">
              <label className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700"
                />
              </label>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold focus:outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold focus:outline-none"
              >
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
