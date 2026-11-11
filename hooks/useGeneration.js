"use client";

import { useState, useRef, useCallback } from "react";

export function useGeneration() {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [sourceMeta, setSourceMeta] = useState(null);
  const [lastParams, setLastParams] = useState(null);

  // Stale response tracking & request cancellation
  const abortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);
  const originalSourceTextRef = useRef("");

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (status === "loading") {
      setStatus("idle");
    }
  }, [status]);

  const generate = useCallback(
    async ({ text, file, mode = "both", targetCount = 6, refinementPrompt = null, existingSet = null }) => {
      // Abort any existing in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Increment request ID for stale response protection
      const currentRequestId = ++latestRequestIdRef.current;

      setStatus("loading");
      setError(null);
      setLastParams({ text, file, mode, targetCount, refinementPrompt, existingSet });
      if (!refinementPrompt) {
        originalSourceTextRef.current = text ? String(text).slice(0, 8000) : "";
      }

      try {
        let response;

        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          if (text) formData.append("text", text);
          formData.append("mode", mode);
          formData.append("targetCount", String(targetCount));
          if (refinementPrompt) formData.append("refinementPrompt", refinementPrompt);
          if (existingSet) formData.append("existingSet", JSON.stringify(existingSet));

          response = await fetch("/api/generate", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
        } else {
          response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              mode,
              targetCount,
              refinementPrompt,
              existingSet,
            }),
            signal: controller.signal,
          });
        }

        // If a newer request was dispatched while this was fetching, discard this response
        if (latestRequestIdRef.current !== currentRequestId) {
          return null;
        }

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || `Generation failed with status ${response.status}`);
        }

        setData(json.data);
        if (!refinementPrompt) {
          setSourceMeta(json.source || { type: file ? "pdf" : "text", name: file?.name || null });
        }
        setStatus("success");
        return json.data;
      } catch (err) {
        // Discard errors from older or aborted requests
        if (latestRequestIdRef.current !== currentRequestId) {
          return null;
        }

        if (err.name === "AbortError" || controller.signal.aborted) {
          setStatus("idle");
          return null;
        }

        const errorMessage = err.message || "Failed to generate study materials. Please check your network and API key.";
        setError(errorMessage);
        setStatus("error");
        return null;
      } finally {
        if (latestRequestIdRef.current === currentRequestId) {
          abortControllerRef.current = null;
        }
      }
    },
    []
  );

  const retry = useCallback(() => {
    if (lastParams) {
      return generate(lastParams);
    }
  }, [generate, lastParams]);

  const refine = useCallback(
    (prompt) => {
      if (!data) return;
      const currentCount = Math.min(
        20,
        Math.max(data.flashcards?.length || 0, data.quiz?.length || 0, 6)
      );
      const sourceContext = originalSourceTextRef.current
        ? `Refine existing study set "${data.title || "Untitled Study Set"}" using original source notes:\n${originalSourceTextRef.current}`
        : `Refine existing study set: ${data.title || "Untitled Study Set"}`;
      return generate({
        text: sourceContext,
        mode: data.mode || "both",
        targetCount: currentCount,
        refinementPrompt: prompt,
        existingSet: {
          title: data.title,
          topic: data.topic,
          summary: data.summary,
          flashcards: data.flashcards,
          quiz: data.quiz,
        },
      });
    },
    [data, generate]
  );

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setSourceMeta(null);
    setError(null);
    setStatus("idle");
    setLastParams(null);
    originalSourceTextRef.current = "";
  }, [cancel]);

  return {
    status,
    isLoading: status === "loading",
    isError: status === "error",
    isSuccess: status === "success",
    error,
    data,
    sourceMeta,
    setData,
    generate,
    refine,
    retry,
    cancel,
    reset,
  };
}

