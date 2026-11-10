"use client";

import { useState, useRef, useEffect } from "react";
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
  Clock,
  Check,
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
  const [mode, setMode] = useState("both"); // "both" | "flashcards" | "quiz"
  const [itemCount, setItemCount] = useState(6);
  const [validationError, setValidationError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const fileInputRef = useRef(null);

  const sampleTopics = [
    {
      title: "Operating Systems",
      desc: "Virtual Memory, Page Replacement, and Thrashing algorithms.",
      text: "Virtual memory creates an illusion of large contiguous memory by paging between RAM and secondary storage. Key algorithms include FIFO, LRU (Least Recently Used), and Clock algorithm. Thrashing occurs when page fault overhead exceeds useful CPU execution.",
    },
    {
      title: "Distributed Systems",
      desc: "CAP Theorem, Consistency Guarantees, and Partition Tolerance.",
      text: "The CAP theorem states that a distributed data store can simultaneously provide at most two out of three guarantees: Consistency (all nodes see the same data at the same time), Availability (every request receives a non-error response), and Partition Tolerance (the system continues to operate despite network drops). In the presence of a network partition, a system must choose between Consistency (CP) or Availability (AP). Eventual consistency models allow replicas to converge over time without strict real-time synchronization.",
    },
    {
      title: "Cell Biology",
      desc: "Mitochondria, Glycolysis, Krebs Cycle, and ATP Synthase.",
      text: "Cellular respiration converts biochemical energy from nutrients into adenosine triphosphate (ATP). The four main stages are Glycolysis (in the cytoplasm), the Transition Step, the Citric Acid (Krebs) Cycle in the mitochondrial matrix, and Oxidative Phosphorylation along the inner mitochondrial cristae via the electron transport chain and ATP synthase.",
    },
  ];

  // Dynamic step progression for loader
  const loadingSteps = [
    "Analyzing source material & syllabus structure...",
    "Extracting conceptual knowledge graphs with Google Gemini...",
    "Synthesizing active-recall cards & multiple-choice distractors...",
    "Validating structured Zod schemas & finalizing UI payload...",
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      setElapsedSeconds(0);
      setLoadingStep(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setLoadingStep((prev) => Math.min(prev + 1, loadingSteps.length - 1));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header row with source indicator */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wide uppercase text-text-secondary flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-blue" />
              {selectedFile ? "Focus Notes or Topic Instructions" : "Source Material, Notes or Topic"}
            </label>
            <span className="text-xs text-text-tertiary font-mono">
              {inputText.length > 0 ? `${inputText.length} chars` : selectedFile ? "Optional focus notes" : "Paste text or upload PDF"}
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
            placeholder={
              selectedFile
                ? "Optional: Add specific focus instructions or syllabus chapters to extract from the attached PDF..."
                : "Enter a topic (e.g., DSA, Operating Systems, Cell Biology) or paste lecture notes here..."
            }
            rows={selectedFile ? 3 : 5}
            className="w-full rounded-xl bg-canvas/80 border border-border-subtle p-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-sky/50 focus:ring-1 focus:ring-accent-sky/30 transition-all resize-y leading-relaxed"
          />

          {validationError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {validationError}
            </p>
          )}

          {/* Attached PDF Banner if file selected */}
          {selectedFile && (
            <div className="p-3 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-accent-sky flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    Attached: {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-text-tertiary">
                    {(selectedFile.size / 1024).toFixed(0)} KB &bull; PDF document will be parsed as primary knowledge source
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-text-tertiary hover:text-rose-400 p-1 rounded-md transition-colors"
                title="Remove attached PDF"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Configuration Grid: Mode & Quantity */}
          <div className="pt-4 border-t border-border-subtle/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary">
                Format
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-canvas/80 border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setMode("both")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mode === "both"
                      ? "bg-surface-hover text-text-primary border border-border-translucent font-semibold shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-accent-amber" />
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => setMode("flashcards")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mode === "flashcards"
                      ? "bg-surface-hover text-text-primary border border-border-translucent font-semibold shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <Layers className="w-3 h-3 text-accent-blue" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setMode("quiz")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mode === "quiz"
                      ? "bg-surface-hover text-text-primary border border-border-translucent font-semibold shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <BookOpen className="w-3 h-3 text-accent-yellow" />
                  Quiz
                </button>
              </div>
            </div>

            {/* Quantity Selector with Clear Explanatory Label */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary flex items-center justify-between">
                <span>Items Per Format</span>
                <span className="font-mono text-text-secondary">
                  {mode === "both" ? `${itemCount} cards + ${itemCount} questions` : `${itemCount} items`}
                </span>
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-canvas/80 border border-border-subtle">
                {[4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setItemCount(num)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                      itemCount === num
                        ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/40 font-semibold shadow-sm"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {num} items
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row: PDF Attachment & Submit CTA */}
          <div className="pt-4 border-t border-border-subtle/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
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
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                  selectedFile
                    ? "bg-accent-blue/15 border-accent-blue/40 text-accent-blue"
                    : "bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-translucent"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {selectedFile ? "Replace PDF Document" : "Attach PDF Document"}
              </label>
            </div>

            {/* Action CTA */}
            <div>
              {isLoading ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel Generation
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-accent-amber/90 via-accent-sky/90 to-accent-blue/90 text-black hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  Generate Study Assistant
                </button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Active Multi-Step Loading State */}
      {isLoading && (
        <Card className="border-accent-sky/30 bg-surface/70 backdrop-blur-xl shadow-glass animate-fade-in p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center">
                <RefreshCw className="w-4.5 h-4.5 text-accent-sky animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary tracking-tight">
                  Synthesizing with Google Gemini
                </p>
                <p className="text-xs text-text-secondary font-mono">
                  Elapsed: {elapsedSeconds}s &bull; Mode: {mode.toUpperCase()} ({itemCount} items)
                </p>
              </div>
            </div>
            <Badge variant="accent" size="xs">
              Gemini 2.5 Active
            </Badge>
          </div>

          {/* Stepper Indicator */}
          <div className="space-y-2 pt-2 border-t border-border-subtle/60">
            {loadingSteps.map((step, idx) => {
              const isPast = idx < loadingStep;
              const isCurrent = idx === loadingStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 text-xs transition-colors ${
                    isCurrent
                      ? "text-accent-sky font-medium"
                      : isPast
                      ? "text-emerald-400/80"
                      : "text-text-tertiary opacity-40"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                      isCurrent
                        ? "border-accent-sky bg-accent-sky/20 animate-pulse"
                        : isPast
                        ? "border-emerald-500/50 bg-emerald-500/20"
                        : "border-border-subtle bg-surface"
                    }`}
                  >
                    {isPast ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                  </div>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Error State with Retry Button */}
      {error && !isLoading && (
        <Card className="border-rose-500/40 bg-rose-950/20 backdrop-blur-xl animate-fade-in">
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

      {/* Quick Start Topics with Equal Height Alignment */}
      {!isLoading && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Or test with a sample topic:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
            {sampleTopics.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(item.text);
                  setSelectedFile(null);
                }}
                className="text-left p-3.5 rounded-xl border border-border-subtle bg-surface-translucent hover:bg-surface hover:border-border-translucent transition-all group flex flex-col justify-between h-full min-h-[100px]"
              >
                <div>
                  <p className="text-xs font-semibold text-text-primary group-hover:text-accent-blue transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowRight className="w-3 h-3 text-text-tertiary group-hover:text-accent-blue transition-transform group-hover:translate-x-0.5" />
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-accent-sky/70 font-mono">
                  Click to load &rarr;
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
