"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, Sparkles } from "lucide-react";

export default function StudyChecklist({
  items = [],
  onToggleItem,
  onAddItem,
  onDeleteItem,
  title = "Actionable Study Plan",
}) {
  const [newTask, setNewTask] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim() || !onAddItem) return;
    onAddItem(newTask.trim());
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
                className="flex items-center gap-3 text-left flex-1 group"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 group-hover:text-yellow-600 flex-shrink-0" />
                )}
                <span
                  className={`text-lg font-hand leading-relaxed ${
                    item.completed ? "line-through text-slate-400" : "text-slate-800 font-semibold"
                  }`}
                >
                  {item.task}
                </span>
              </button>

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
        <form onSubmit={handleAdd} className="flex items-center gap-3 pt-4 border-t-2 border-dashed border-slate-200">
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
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-yellow-400 text-slate-900 font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm hover:bg-yellow-300 disabled:opacity-40 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </form>
      )}
    </div>
  );
}
