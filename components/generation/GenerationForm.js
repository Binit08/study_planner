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
  Sliders,
  CheckCircle2,
  Wand2,
  Info,
} from "lucide-react";
import GenerationSidebar from "./GenerationSidebar";

const LOADING_STEPS = [
  "Skimming & parsing raw notes / PDF stream...",
  "Extracting key concepts & knowledge graphs...",
  "Formulating flashcards, distractors & explanations...",
  "Validating structured Zod schemas...",
];

export default function GenerationForm({
  onGenerate,
  onCancel,
  onRetry,
  isLoading,
  error,
}) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mode, setMode] = useState("both"); // "both" | "cards" | "quiz"
  const [itemCount, setItemCount] = useState(6);
  const [validationError, setValidationError] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const fileInputRef = useRef(null);

  const sampleTopics = [
    {
      title: "Operating Systems",
      desc: "Virtual Memory, Page Replacement, & Thrashing algorithms.",
      text: "Virtual memory creates an illusion of large contiguous memory by paging between RAM and secondary storage. Key algorithms include FIFO, LRU (Least Recently Used), and Clock algorithm. Thrashing occurs when page fault overhead exceeds useful CPU execution.",
    },
    {
      title: "Distributed Systems",
      desc: "CAP Theorem, Consistency Guarantees, & Partition Tolerance.",
      text: "The CAP theorem states that a distributed data store can simultaneously provide at most two out of three guarantees: Consistency (all nodes see the same data at the same time), Availability (every request receives a non-error response), and Partition Tolerance (the system continues to operate despite network drops). In the presence of a network partition, a system must choose between Consistency (CP) or Availability (AP). Eventual consistency models allow replicas to converge over time without strict real-time synchronization.",
    },
    {
      title: "Cell Biology",
      desc: "Mitochondria, Glycolysis, Krebs Cycle, & ATP Synthase.",
      text: "Cellular respiration converts biochemical energy from nutrients into adenosine triphosphate (ATP). The four main stages are Glycolysis (in the cytoplasm), the Transition Step, the Citric Acid (Krebs) Cycle in the mitochondrial matrix, and Oxidative Phosphorylation along the inner mitochondrial cristae via the electron transport chain and ATP synthase.",
    },
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      setElapsedSeconds(0);
      setLoadingStep(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
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
      mode: mode === "cards" ? "flashcards" : mode,
      targetCount: itemCount,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Card (7 cols) */}
      <div className="lg:col-span-7">
        <div
          className={`bg-white p-6 sm:p-8 relative transition-all duration-300 wobbly-border hard-shadow tape-effect ${isLoading ? "opacity-60 pointer-events-none" : ""
            }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Feed me your notes */}
            <div>
              <label className="block text-2xl font-bold font-hand mb-2 text-[#2d2d2d]">
                1. Feed me your notes...
              </label>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
                placeholder={
                  selectedFile
                    ? "Optional: Add specific focus points or syllabus chapters to extract from the PDF..."
                    : "Paste syllabus, lecture transcripts, or just a topic like 'Photosynthesis' or 'DSA'..."
                }
                rows={selectedFile ? 3 : 5}
                className="w-full p-4 text-xl bg-yellow-50/40 border-2 border-dashed border-slate-400 focus:border-slate-800 focus:outline-none transition-all focus:ring-4 focus:ring-yellow-200/50 rounded-2xl font-normal leading-relaxed text-[#2d2d2d] placeholder:text-slate-400"
              />
              <div className="flex justify-between items-center mt-2 text-slate-500 text-base">
                <span className="flex items-center gap-1">
                  <Info className="w-4 h-4 text-slate-400" />
                  {selectedFile ? "PDF attached — notes above will guide focus" : "Paste notes or type any syllabus topic"}
                </span>
                <span className="font-bold font-mono">{inputText.length} chars</span>
              </div>

              {validationError && (
                <div className="mt-3 p-2.5 border-2 border-dashed border-red-400 bg-red-50 text-red-600 text-base font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* 2. Or drop a PDF & 3. Format & Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PDF Drop */}
              <div>
                <label className="block text-xl font-bold font-hand mb-2 text-[#2d2d2d]">
                  2. Or drop a PDF
                </label>
                <div className="border-2 border-dashed border-slate-300 p-4 rounded-xl text-center hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden min-h-[110px] flex flex-col items-center justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    id="pdf-upload"
                  />
                  <Upload className="w-7 h-7 text-slate-400 mb-1" />
                  <p className="text-slate-600 text-sm font-bold">Click to upload lecture PDF</p>
                  <p className="text-[11px] text-slate-400">PDF text parsed on server</p>

                  {selectedFile && (
                    <div className="absolute inset-0 bg-green-50 z-10 flex items-center justify-between px-3 border-2 border-green-400 rounded-xl">
                      <div className="flex items-center gap-2 text-left truncate mr-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-green-800 truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-green-600">{(selectedFile.size / 1024).toFixed(0)} KB ready</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 z-30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Format & Size */}
              <div>
                <label className="block text-xl font-bold font-hand mb-2 text-[#2d2d2d]">
                  3. Format & Size
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setMode("both")}
                    className={`flex-1 py-1.5 px-2 border-2 text-base font-bold rotate-1 transition-all ${mode === "both"
                        ? "border-[#2d2d2d] bg-yellow-200 hard-shadow-sm"
                        : "border-slate-300 bg-white hover:bg-yellow-50"
                      }`}
                  >
                    Both
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("cards")}
                    className={`flex-1 py-1.5 px-2 border-2 text-base font-bold -rotate-1 transition-all ${mode === "cards"
                        ? "border-[#2d2d2d] bg-yellow-200 hard-shadow-sm"
                        : "border-slate-300 bg-white hover:bg-yellow-50"
                      }`}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("quiz")}
                    className={`flex-1 py-1.5 px-2 border-2 text-base font-bold rotate-2 transition-all ${mode === "quiz"
                        ? "border-[#2d2d2d] bg-yellow-200 hard-shadow-sm"
                        : "border-slate-300 bg-white hover:bg-yellow-50"
                      }`}
                  >
                    Quiz
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                    Quantity:
                  </span>
                  <div className="flex gap-3 text-lg font-hand">
                    {[4, 6, 10].map((num) => (
                      <span
                        key={num}
                        onClick={() => setItemCount(num)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${itemCount === num
                            ? "font-bold text-yellow-800 underline decoration-wavy decoration-yellow-500 bg-yellow-200"
                            : "hover:text-yellow-600 text-slate-600"
                          }`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs mt-1 text-slate-400 text-center italic">
                  {mode === "both"
                    ? `${itemCount} cards + ${itemCount} questions`
                    : `${itemCount} items per set`}
                </p>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-yellow-400 text-2xl font-bold py-4 px-6 font-hand transition-all hover:bg-yellow-300 flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 wobbly-border-sm hard-shadow-sm btn-press cursor-pointer"
              >
                <span>Generate Study Assistant</span>
                <Wand2 className="w-6 h-6 text-[#2d2d2d]" />
              </button>

              {isLoading && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 text-slate-500 hover:text-red-500 font-bold transition-colors font-hand text-xl"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && !isLoading && (
              <div className="mt-4 p-4 border-2 border-dashed border-red-400 bg-red-50 text-red-600 rounded-xl text-base flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold">Generation failed</p>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1 bg-white border border-red-400 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Right Column (5 cols): Stepper / Expected Output */}
      <div className="lg:col-span-5 relative">
        <GenerationSidebar
          isLoading={isLoading}
          elapsedSeconds={elapsedSeconds}
          loadingStep={loadingStep}
          loadingSteps={LOADING_STEPS}
          itemCount={itemCount}
          sampleTopics={sampleTopics}
          onSelectSample={(item) => {
            setInputText(item.text);
            setSelectedFile(null);
          }}
        />
      </div>
    </div>
  );
}
