"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, PlusCircle, Sparkles, Notebook, ArrowUpDown, BookOpen } from "lucide-react";
import StudySetCard from "@/components/history/StudySetCard";

export default function HistoryPage() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchSets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-sets");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load study sets");
      setSets(json.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleDelete = async (id) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/study-sets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete study set");
      setSets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Distinct topics
  const topics = Array.from(new Set(sets.map((s) => s.topic).filter(Boolean)));

  const filteredSets = sets
    .filter((s) => {
      const matchesSearch =
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.topic?.toLowerCase().includes(search.toLowerCase()) ||
        s.source_preview?.toLowerCase().includes(search.toLowerCase());
      const matchesTopic = topicFilter === "all" || s.topic === topicFilter;
      return matchesSearch && matchesTopic;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      if (sortBy === "most_studied") {
        const countA = (a.attempts?.length || 0) + (a.progress?.length || 0);
        const countB = (b.attempts?.length || 0) + (b.progress?.length || 0);
        return countB - countA;
      }
      // default newest
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const cardRotations = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-1"];

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="relative inline-block rotate-[-1deg]">
            <h1 className="text-4xl md:text-5xl font-bold font-hand mb-2">My Study Library</h1>
            <div className="h-2 bg-yellow-300 w-full opacity-40 -mt-3 -ml-1 rounded" />
          </div>

          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setTopicFilter("all")}
                className={`px-4 py-2 wobbly-border-sm hard-shadow-sm font-bold font-hand text-lg transition-all ${topicFilter === "all" ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
                  }`}
              >
                All Topics
              </button>
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopicFilter(t)}
                  className={`px-4 py-2 wobbly-border-sm hard-shadow-sm font-bold font-hand text-lg transition-all ${topicFilter === t ? "bg-yellow-300" : "bg-white hover:bg-yellow-50"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search & Sort Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, topics, or keywords..."
              className="w-full pl-12 pr-4 py-3 bg-white wobbly-border-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-hand text-xl text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white wobbly-border-sm focus:outline-none font-bold font-hand text-lg text-slate-800"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="oldest">Sort by: Oldest</option>
              <option value="most_studied">Most Studied</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      {actionError && (
        <div className="bg-rose-50 border-2 border-rose-500 p-4 wobbly-border-sm flex items-center justify-between gap-4">
          <p className="font-hand text-lg text-rose-800 font-bold">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-sm font-hand font-bold text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 bg-yellow-300 flex items-center justify-center rounded-2xl border-2 border-slate-800 mx-auto animate-spin">
            <Sparkles className="w-6 h-6 text-slate-800" />
          </div>
          <p className="text-xl font-hand text-slate-600">Loading your handwritten decks...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-8 wobbly-border-sm hard-shadow-sm text-center">
          <p className="text-xl font-hand text-rose-700">{error}</p>
        </div>
      ) : (
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {filteredSets.map((set, idx) => (
            <StudySetCard
              key={set.id}
              set={set}
              onDelete={handleDelete}
              rotation={cardRotations[idx % cardRotations.length]}
            />
          ))}

          {/* New Study Set Card */}
          <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm card-3d-hover -rotate-1 group border-dashed opacity-90 flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="flex items-center justify-center flex-col text-center p-4">
              <PlusCircle className="w-12 h-12 text-slate-400 mb-3 animate-bounce" />
              <h3 className="text-2xl font-bold font-hand text-slate-800">New Study Set</h3>
              <p className="text-slate-500 font-hand text-lg mb-6">
                Transform more notes or lecture slides into study gold!
              </p>
              <Link
                href="/"
                className="px-6 py-2.5 border-2 border-slate-800 font-bold font-hand text-lg uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-all rounded-lg"
              >
                Start Generating
              </Link>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Inspiration Banner */}
      <section className="bg-yellow-50/70 p-10 md:p-12 wobbly-border hard-shadow text-center relative overflow-hidden">
        <Notebook className="absolute -top-8 -left-8 w-44 h-44 text-yellow-200/50 -rotate-12 pointer-events-none" />
        <h2 className="text-3xl md:text-4xl font-bold mb-3 font-hand text-slate-900">
          The more notes you feed our AI assistant, the stronger your mastery becomes.
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-xl mx-auto font-hand">
          Ready to turn that messy PDF, syllabus, or lecture transcript into a flawless interactive study deck?
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-3 bg-yellow-400 px-8 py-3.5 text-2xl font-bold font-hand wobbly-border-sm hard-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-slate-900"
        >
          Generate New Set <Sparkles className="w-6 h-6" />
        </Link>
      </section>
    </div>
  );
}
