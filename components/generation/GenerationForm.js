"use client";

import { useState, useRef } from "react";
import {
  Sparkles,
  Upload,
  FileText,
  X,
  RefreshCw,
  AlertCircle,
  Layers,
  BookOpen,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function GenerationForm({
  onGenerate,
  onCancel,
  onRetry,
  isLoading,
  error,
}) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mode, setMode] = useState("both"); // "flashcards" | "quiz" | "both"
  const [itemCount, setItemCount] = useState(6);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const sampleTopics = [
    {
      title: "Operating Systems",
      desc: "Virtual Memory, Page Replacement, and Thrashing",
      text: "Virtual memory creates an illusion of large contiguous memory by paging between RAM and secondary storage. Key algorithms include FIFO, LRU (Least Recently Used), and Clock algorithm. Thrashing occurs when page fault overhead exceeds useful CPU execution.",
    },
    {
      title: "Distributed Systems",
      desc: "CAP Theorem and Consistency Models",
      text: "The CAP theorem states that a distributed data store can simultaneously provide at most two out of three guarantees: Consistency (all nodes see the same data at the same time), Availability (every request receives a non-error response), and Partition Tolerance (the system continues to operate despite network drops). In the presence of a network partition, a system must choose between Consistency (CP) or Availability (AP). Eventual consistency models allow replicas to converge over time without strict real-time synchronization.",
    },
    {
      title: "Cell Biology",
      desc: "Mitochondria & ATP Cellular Respiration",
      text: "Cellular respiration converts biochemical energy from nutrients into adenosine triphosphate (ATP). The four main stages are Glycolysis (in the cytoplasm), the Transition Step, the Citric Acid (Krebs) Cycle in the mitochondrial matrix, and Oxidative Phosphorylation along the inner mitochondrial cristae via the electron transport chain and ATP synthase.",
    },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setValidationError("Please upload a valid PDF document (.pdf).");
        return;
      }
      setValidationError(null);
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!selectedFile && trimmed.length < 2) {
      setValidationError("Enter a topic (at least 2 characters), paste notes, or attach a PDF document.");
      return;
    }

    setValidationError(null);
    onGenerate({
      text: trimmed,
      file: selectedFile,
      mode,
      targetCount: itemCount,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Input Box Card */}
      <Card className="border-border-subtle/80 bg-surface/50 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-sky/30 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wide uppercase text-text-secondary flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-blue" />
              Source Material or Notes
            </label>
            <span className="text-xs text-text-tertiary">
              {inputText.length > 0 ? `${inputText.length} chars` : "Paste text or upload PDF"}
            </span>
          </div>

          {/* Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={isLoading}
            placeholder="Enter a topic (e.g., DSA, Operating Systems) or paste lecture notes here..."
            rows={selectedFile ? 3 : 5}
            className="w-full rounded-lg bg-canvas/80 border border-border-subtle p-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-sky/50 focus:ring-1 focus:ring-accent-sky/30 transition-all resize-y leading-relaxed"
          />

          {validationError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {validationError}
            </p>
          )}

          {/* PDF Upload Badge / Input */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                  selectedFile
                    ? "bg-accent-blue/10 border-accent-blue/40 text-accent-blue"
                    : "bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-translucent"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {selectedFile ? "Replace PDF" : "Attach PDF Document"}
              </label>

              {selectedFile && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-xs text-text-primary border border-border-subtle">
                  <span className="truncate max-w-[180px] font-medium">{selectedFile.name}</span>
                  <span className="text-text-tertiary text-[10px]">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-text-tertiary hover:text-rose-400 ml-1 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Target Count Slider */}
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-xs text-text-secondary">Quantity:</span>
              <div className="flex items-center gap-1">
                {[4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setItemCount(num)}
                    className={`px-2 py-0.5 rounded text-xs transition-all ${
                      itemCount === num
                        ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/40 font-medium"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selector & Action Buttons */}
          <div className="pt-3 border-t border-border-subtle/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Mode toggle */}
            <div className="inline-flex rounded-lg p-1 bg-canvas/80 border border-border-subtle">
              <button
                type="button"
                onClick={() => setMode("both")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  mode === "both"
                    ? "bg-surface-hover text-text-primary shadow-sm border border-border-translucent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                Both
              </button>
              <button
                type="button"
                onClick={() => setMode("flashcards")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  mode === "flashcards"
                    ? "bg-surface-hover text-text-primary shadow-sm border border-border-translucent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-accent-blue" />
                Flashcards
              </button>
              <button
                type="button"
                onClick={() => setMode("quiz")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  mode === "quiz"
                    ? "bg-surface-hover text-text-primary shadow-sm border border-border-translucent"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-accent-yellow" />
                Quiz
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel Generation
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-medium bg-gradient-to-r from-accent-amber/90 via-accent-sky/90 to-accent-blue/90 text-black hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 font-semibold tracking-wide cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  Generate Study Assistant
                </button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Loading Indicator State */}
      {isLoading && (
        <Card className="border-accent-sky/30 bg-surface/60 backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-accent-sky animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary tracking-tight">
                Synthesizing notes with Google Gemini...
              </p>
              <p className="text-xs text-text-secondary">
                Analyzing concepts, structuring pedagogical flashcards, and formulating multiple-choice questions.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State with Retry Button */}
      {error && !isLoading && (
        <Card className="border-rose-500/40 bg-rose-950/20 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-rose-200">AI Generation Failed</p>
                <p className="text-xs text-rose-300/80 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-200 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </Card>
      )}

      {/* Quick Start Topics */}
      {!isLoading && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Or test with a sample topic:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sampleTopics.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(item.text);
                  setSelectedFile(null);
                }}
                className="text-left p-3 rounded-lg border border-border-subtle bg-surface-translucent hover:bg-surface hover:border-border-translucent transition-all group"
              >
                <p className="text-xs font-semibold text-text-primary group-hover:text-accent-blue transition-colors flex items-center justify-between">
                  {item.title}
                  <ArrowRight className="w-3 h-3 text-text-tertiary group-hover:text-accent-blue transition-transform group-hover:translate-x-0.5" />
                </p>
                <p className="text-[11px] text-text-secondary line-clamp-2 mt-1 leading-snug">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

