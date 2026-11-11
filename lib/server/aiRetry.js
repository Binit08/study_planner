export function classifyAiError(err, signal) {
  if (err?.name === "AbortError" || signal?.aborted) {
    return err;
  }

  const message = err?.message || "";
  if (
    message.includes("API_KEY_INVALID") ||
    message.includes("401") ||
    message.includes("UNAUTHENTICATED")
  ) {
    const e = new Error(
      "Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local."
    );
    e.code = "INVALID_API_KEY";
    return e;
  }
  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota")
  ) {
    const e = new Error(
      "Gemini API rate limit or quota exceeded. Please wait a moment and retry."
    );
    e.code = "RATE_LIMIT";
    return e;
  }
  if (message.includes("SAFETY") || message.includes("blocked")) {
    const e = new Error(
      "The content was blocked by Gemini safety filters. Try phrasing your notes differently."
    );
    e.code = "SAFETY_BLOCK";
    return e;
  }
  return err;
}

export function isRetryableAiError(err, signal) {
  if (!err || signal?.aborted || err.name === "AbortError") return false;
  if (err.code === "INVALID_API_KEY" || err.code === "SAFETY_BLOCK") return false;
  if (err.code === "MALFORMED_AI_OUTPUT" || err.code === "RATE_LIMIT") return true;

  const msg = String(err.message || "");
  return /timeout|timed out|503|502|500|UNAVAILABLE|JSON/i.test(msg);
}

export function waitWithAbort(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const abortError = new Error("Generation was cancelled by the user");
      abortError.name = "AbortError";
      reject(abortError);
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      const abortError = new Error("Generation was cancelled by the user");
      abortError.name = "AbortError";
      reject(abortError);
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function executeWithSingleRetry(
  runAttempt,
  { signal, retryDelayMs = 450, onRetry } = {}
) {
  const maxAttempts = 2;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (signal?.aborted) {
        const abortError = new Error("Generation was cancelled by the user");
        abortError.name = "AbortError";
        throw abortError;
      }
      return await runAttempt(attempt);
    } catch (err) {
      const normalized = classifyAiError(err, signal);
      lastError = normalized;

      if (attempt !== 0 || !isRetryableAiError(normalized, signal)) {
        throw normalized;
      }

      onRetry?.(normalized, attempt + 1);
      await waitWithAbort(retryDelayMs, signal);
    }
  }

  throw lastError;
}

