"use client";

import { CheckCircle2, Layers, Flame, Clock } from "lucide-react";

/**
 * Top 4 quick-glance summary cards on the Study Planner dashboard.
 */
export default function PlannerStats({ stats }) {
  const streak = stats?.streak || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 wobbly-border-sm hard-shadow-sm flex items-center gap-3">
        <div className="w-11 h-11 bg-yellow-200 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-[#2d2d2d]" />
        </div>
        <div>
          <div className="text-2xl font-bold font-hand text-slate-900">
            {stats?.todayDone || 0} / {stats?.todayTotal || 0}
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
            {stats?.totalDueCards || 0} Due
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
            {streak} {streak === 1 ? "Day" : "Days"}
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
            {stats?.minutesToday || 0}m
          </div>
          <div className="text-xs uppercase font-bold text-slate-500">
            Today ({stats?.minutesWeek || 0}m / wk)
          </div>
        </div>
      </div>
    </div>
  );
}

