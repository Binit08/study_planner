"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { History, Search, Plus, Sparkles, Filter, RefreshCw } from "lucide-react";
import StudySetCard from "@/components/history/StudySetCard";
import Card from "@/components/ui/Card";

export default function HistoryPage() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");

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
    try {
      const res = await fetch(`/api/study-sets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete study set");
      setSets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Extract distinct topics
  const topics = Array.from(new Set(sets.map((s) => s.topic).filter(Boolean)));

  const filteredSets = sets.filter((s) => {
    const matchesSearch =
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.topic?.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = topicFilter === "all" || s.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <History className="w-6 h-6 text-accent-blue" />
            Study Library
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Browse and review your saved study sets, flashcard decks, and quiz evaluations.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-accent-amber to-accent-sky text-black hover:opacity-90 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-black" />
          Create New Set
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or topic..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-sky/50"
          />
        </div>

        {topics.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <Filter className="w-3.5 h-3.5 text-text-tertiary mr-1" />
            <button
              onClick={() => setTopicFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                topicFilter === "all"
                  ? "bg-surface-hover text-text-primary border border-border-translucent font-medium"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              All Topics
            </button>
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopicFilter(t)}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                  topicFilter === t
                    ? "bg-surface-hover text-text-primary border border-border-translucent font-medium"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid or Empty/Loading State */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-accent-sky animate-spin mx-auto" />
          <p className="text-xs text-text-secondary">Loading your study sets...</p>
        </div>
      ) : error ? (
        <Card className="text-center py-12 border-rose-500/30 bg-rose-950/20 space-y-3">
          <p className="text-sm text-rose-200">Failed to load study library: {error}</p>
          <button
            onClick={fetchSets}
            className="px-3 py-1.5 rounded-lg text-xs bg-surface border border-border-subtle text-text-primary"
          >
            Retry
          </button>
        </Card>
      ) : filteredSets.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle mx-auto flex items-center justify-center text-text-tertiary">
            <Sparkles className="w-6 h-6 text-accent-amber" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-text-primary tracking-tight">
              {search || topicFilter !== "all"
                ? "No matching study sets found"
                : "Your study library is empty"}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              {search || topicFilter !== "all"
                ? "Try adjusting your search terms or filters."
                : "Paste notes or upload a PDF on the Generate page to create your first interactive study set."}
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-sky text-black hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Generate Your First Set
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSets.map((set) => (
            <StudySetCard key={set.id} set={set} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
