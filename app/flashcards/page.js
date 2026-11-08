"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Plus, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FlashcardViewer from "@/components/flashcards/FlashcardViewer";

export default function FlashcardsHubPage() {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await fetch("/api/study-sets");
        const json = await res.json();
        if (json.data) {
          const setsWithCards = json.data.filter(
            (s) => Array.isArray(s.flashcards) && s.flashcards.length > 0
          );
          setSets(setsWithCards);
          if (setsWithCards.length > 0) {
            setSelectedSet(setsWithCards[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSets();
  }, []);

  const handleUpdateProgress = async (cardIndex, status) => {
    setProgressMap((prev) => ({ ...prev, [cardIndex]: status }));
    if (!selectedSet?.id) return;

    try {
      await fetch(`/api/study-sets/${selectedSet.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIndex, status }),
      });
    } catch (err) {
      console.error("Failed to sync progress:", err);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Layers className="w-6 h-6 text-accent-blue" />
            Flashcard Decks
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Active recall practice with 3D flip cards, mastery tracking, and keyboard navigation.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-surface border border-border-subtle hover:bg-surface-hover text-text-primary transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-accent-blue" />
          Create New Deck
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-accent-sky animate-spin mx-auto" />
          <p className="text-xs text-text-secondary">Loading your flashcards...</p>
        </div>
      ) : sets.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle mx-auto flex items-center justify-center text-text-tertiary">
            <Layers className="w-6 h-6 text-accent-blue" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-text-primary">No flashcard decks yet</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Generate flashcards from notes or PDFs to start practicing active recall.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-sky text-black hover:opacity-90 transition-all"
          >
            Generate Flashcards
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Deck Selector Tabs */}
          {sets.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {sets.map((set) => {
                const isSelected = selectedSet?.id === set.id;
                return (
                  <button
                    key={set.id}
                    onClick={() => {
                      setSelectedSet(set);
                      setProgressMap({});
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-surface-hover text-text-primary border border-border-translucent font-semibold"
                        : "bg-surface/40 text-text-tertiary hover:text-text-secondary border border-border-subtle/50"
                    }`}
                  >
                    <span>{set.title}</span>
                    <span className="font-mono text-[10px] text-accent-blue">
                      ({set.flashcards.length})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Flashcard Viewer */}
          {selectedSet && (
            <FlashcardViewer
              cards={selectedSet.flashcards || []}
              title={selectedSet.title}
              progressMap={progressMap}
              onUpdateProgress={handleUpdateProgress}
            />
          )}
        </div>
      )}
    </div>
  );
}
