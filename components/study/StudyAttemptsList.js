"use client";

import { Award } from "lucide-react";

export default function StudyAttemptsList({ attempts = [] }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b-2 border-dashed border-slate-200 pb-3">
        <h3 className="text-2xl font-bold font-hand text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-600" />
          Past Quiz Submissions
        </h3>
      </div>

      <div className="space-y-4">
        {attempts.map((att, idx) => {
          const pct = Math.round((att.score / att.total_questions) * 100);
          const passed = pct >= 70;
          const dateStr = att.created_at
            ? new Date(att.created_at).toLocaleString()
            : "Recent";

          return (
            <div
              key={att.id || idx}
              className="bg-white p-5 wobbly-border-sm hard-shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold font-hand text-slate-900">
                    Score: {att.score} / {att.total_questions}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded text-xs font-bold uppercase ${
                      passed
                        ? "bg-green-100 text-green-800 border border-green-600"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-600"
                    }`}
                  >
                    {passed ? "Passed" : "Needs Review"}
                  </span>
                </div>
                <p className="text-sm font-hand text-slate-400 mt-1">{dateStr}</p>
              </div>

              <span className="text-3xl font-bold font-hand text-slate-900">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

