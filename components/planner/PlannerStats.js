"use client";

import { CheckCircle2, Layers, Flame, Clock } from "lucide-react";

/**
 * Top 4 quick-glance summary cards on the Study Planner dashboard.
 */
export default function PlannerStats({ stats }) {
  const streak = stats?.streak || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white p-3 wobbly-border-sm hard-shadow-sm flex items-center gap-2.5">
        <div className="w-9 h-9 bg-yellow-200 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[#2d2d2d]" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold font-hand text-slate-900 truncate">
            {stats?.todayDone || 0} / {stats?.todayTotal || 0}
          </div>
          <div className="text-[11px] uppercase font-bold text-slate-500">Tasks Today</div>
        </div>
      </div>

      <div className="bg-white p-3 wobbly-border-sm hard-shadow-sm flex items-center gap-2.5">
        <div className="w-9 h-9 bg-blue-100 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
          <Layers className="w-4 h-4 text-[#2d2d2d]" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold font-hand text-slate-900 truncate">
            {stats?.totalDueCards || 0} Due
          </div>
          <div className="text-[11px] uppercase font-bold text-slate-500">Due Cards</div>
        </div>
      </div>

      <div className="bg-white p-3 wobbly-border-sm hard-shadow-sm flex items-center gap-2.5">
        <div className="w-9 h-9 bg-orange-100 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
          <Flame className="w-4 h-4 text-orange-600" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold font-hand text-slate-900 truncate">
            {streak} {streak === 1 ? "Day" : "Days"}
          </div>
          <div className="text-[11px] uppercase font-bold text-slate-500">Streak</div>
        </div>
      </div>

      <div className="bg-white p-3 wobbly-border-sm hard-shadow-sm flex items-center gap-2.5">
        <div className="w-9 h-9 bg-emerald-100 border-2 border-[#2d2d2d] rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold font-hand text-slate-900 truncate">
            {stats?.minutesToday || 0}m
          </div>
          <div className="text-[11px] uppercase font-bold text-slate-500 truncate">
            Focus Today
          </div>
        </div>
      </div>
    </div>
  );
}

