"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
    <Card className="bg-surface/50 backdrop-blur-xl border-border-subtle p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-accent-sky" />
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
        </div>
        <Badge variant={percentage === 100 ? "mastered" : "accent"} size="xs">
          {completedCount} / {items.length} Done ({percentage}%)
        </Badge>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-sky transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const itemId = item.id || idx;
          return (
            <div
              key={itemId}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                item.completed
                  ? "bg-surface/30 border-border-subtle/50 text-text-tertiary"
                  : "bg-surface-translucent border-border-subtle text-text-primary hover:border-border-translucent"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleItem && onToggleItem(itemId, !item.completed)}
                className="flex items-center gap-3 text-left flex-1 group"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-text-tertiary group-hover:text-accent-sky flex-shrink-0" />
                )}
                <span
                  className={`text-xs leading-relaxed ${
                    item.completed ? "line-through text-text-tertiary" : "text-text-primary"
                  }`}
                >
                  {item.task}
                </span>
              </button>

              {onDeleteItem && (
                <button
                  type="button"
                  onClick={() => onDeleteItem(itemId)}
                  className="text-text-tertiary hover:text-rose-400 p-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="text-center text-xs text-text-tertiary py-4">
            No milestones added yet. Add a study step below.
          </p>
        )}
      </div>

      {/* Add New Task Form */}
      {onAddItem && (
        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-2 border-t border-border-subtle/60">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new study goal or checkpoint..."
            className="flex-1 text-xs rounded-lg bg-canvas border border-border-subtle px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-sky/50"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-surface text-text-primary border border-border-subtle hover:bg-surface-hover disabled:opacity-40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
      )}
    </Card>
  );
}
