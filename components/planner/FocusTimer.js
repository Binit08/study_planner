"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";

const PRESETS = [
  { label: "15m", minutes: 15, type: "focus" },
  { label: "25m", minutes: 25, type: "focus" },
  { label: "45m", minutes: 45, type: "focus" },
  { label: "5m Break", minutes: 5, type: "break" },
];

/**
 * Compact Pomodoro / study sprint timer that logs completed focus sessions.
 */
export default function FocusTimer({
  studySets = [],
  defaultStudySetId = "",
  defaultTopic = "General",
  onSessionLogged,
}) {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[1]); // 25m default
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[1].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState(defaultStudySetId || "");
  const [saving, setSaving] = useState(false);
  const [loggedBanner, setLoggedBanner] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const loggedAutoRef = useRef(false);
  const selectedSetIdRef = useRef(selectedSetId);
  const studySetsRef = useRef(studySets);

  useEffect(() => {
    selectedSetIdRef.current = selectedSetId;
  }, [selectedSetId]);

  useEffect(() => {
    studySetsRef.current = studySets;
  }, [studySets]);

  useEffect(() => {
    if (defaultStudySetId) {
      setSelectedSetId(defaultStudySetId);
    }
  }, [defaultStudySetId]);

  const logSession = useCallback(async (durationMinutes) => {
    setErrorBanner(null);
    if (selectedPreset.type === "break") {
      setLoggedBanner("Break finished! Ready for next sprint.");
      setTimeout(() => setLoggedBanner(null), 3000);
      return;
    }

    const mins = Math.max(1, Math.round(durationMinutes));
    setSaving(true);
    try {
      const currentSetId = selectedSetIdRef.current;
      const linkedSet = studySetsRef.current.find((s) => s.id === currentSetId);
      const res = await fetch("/api/planner/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studySetId: currentSetId || null,
          topic: linkedSet?.topic || defaultTopic || "General",
          durationMinutes: mins,
          activityType: "focus",
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to log study sprint");
      }
      setLoggedBanner(`Logged ${mins}m study sprint!`);
      setTimeout(() => setLoggedBanner(null), 3500);
      if (onSessionLogged) onSessionLogged();
    } catch (err) {
      console.error("Failed to log study session:", err);
      setErrorBanner(err.message || "Could not log session");
    } finally {
      setSaving(false);
    }
  }, [selectedPreset.type, defaultTopic, onSessionLogged]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          if (!loggedAutoRef.current) {
            loggedAutoRef.current = true;
            logSession(selectedPreset.minutes);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, selectedPreset.minutes, logSession]);

  const handleSelectPreset = (preset) => {
    setIsRunning(false);
    loggedAutoRef.current = false;
    setSelectedPreset(preset);
    setSecondsLeft(preset.minutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    loggedAutoRef.current = false;
    setSecondsLeft(selectedPreset.minutes * 60);
  };

  const handleCompleteNow = () => {
    const totalSecs = selectedPreset.minutes * 60;
    const elapsedSecs = totalSecs - secondsLeft;
    const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60) || selectedPreset.minutes);
    setIsRunning(false);
    loggedAutoRef.current = true;
    logSession(elapsedMins);
    setSecondsLeft(selectedPreset.minutes * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const totalSeconds = selectedPreset.minutes * 60;
  const pct = totalSeconds > 0 ? Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100) : 0;

  return (
    <div className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b-2 border-dashed border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-300 border border-[#2d2d2d] rounded-lg flex items-center justify-center">
            <Timer className="w-4 h-4 text-[#2d2d2d]" />
          </div>
          <h3 className="text-xl font-bold font-hand text-slate-900">Focus Timer</h3>
        </div>
        <span className="text-xs font-bold uppercase px-2 py-0.5 bg-yellow-100 rounded border border-slate-300">
          {selectedPreset.type === "break" ? "Break" : "Study Sprint"}
        </span>
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-4 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handleSelectPreset(p)}
            className={`py-1.5 text-sm font-bold font-hand rounded-lg border-2 transition-all ${
              selectedPreset.label === p.label
                ? "bg-yellow-300 border-[#2d2d2d] text-slate-900"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-yellow-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Optional Linked Study Set */}
      {studySets.length > 0 && !defaultStudySetId && (
        <select
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl font-hand text-base text-slate-700 focus:outline-none focus:border-[#2d2d2d]"
        >
          <option value="">General Study Session</option>
          {studySets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      )}

      {/* Clock Display */}
      <div className="bg-yellow-50/70 p-4 rounded-xl border-2 border-[#2d2d2d] text-center space-y-2">
        <div className="text-5xl font-bold font-mono tracking-tight text-slate-900">
          {mins}:{secs}
        </div>
        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#2d2d2d]">
          <div
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            loggedAutoRef.current = false;
            setIsRunning((prev) => !prev);
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold font-hand text-lg wobbly-border-sm hard-shadow-sm transition-all"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 wobbly-border-sm transition-all"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {selectedPreset.type === "focus" && (
          <button
            type="button"
            disabled={saving}
            onClick={handleCompleteNow}
            className="px-3 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold font-hand text-base wobbly-border-sm transition-all disabled:opacity-50"
            title="Log this session to your streak"
          >
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Log
          </button>
        )}
      </div>

      {loggedBanner && (
        <div className="p-2.5 bg-emerald-100 border border-emerald-600 rounded-xl text-center text-sm font-bold font-hand text-emerald-900">
          {loggedBanner}
        </div>
      )}

      {errorBanner && (
        <div className="p-2.5 bg-rose-50 border border-rose-500 rounded-xl text-center text-sm font-bold font-hand text-rose-800">
          {errorBanner}
        </div>
      )}
    </div>
  );
}

