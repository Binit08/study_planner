const DEFAULT_MIN_REQUEST_GAP_MS = 1200;
const DEFAULT_RATE_LIMIT_DELAY_MS = 2000;
const MAX_BACKOFF_MS = 15000;

let nextAllowedRequestAt = 0;
let rateLimitCooldownUntil = 0;
let paceQueue = Promise.resolve();

export function resetRateLimitState() {
  nextAllowedRequestAt = 0;
  rateLimitCooldownUntil = 0;
  paceQueue = Promise.resolve();
}

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
    e.retryAfterMs = extractRetryAfterMs(err);
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

export function extractRetryAfterMs(err) {
  const msg = String(err?.message || "");
  const match = msg.match(/retry\s+(?:after|in)\s+(\d+(?:\.\d+)?)\s*s/i);
  if (match) {
    const ms = Math.ceil(Number(match[1]) * 1000);
    if (Number.isFinite(ms) && ms > 0) {
      return Math.min(ms, MAX_BACKOFF_MS);
    }
  }
  return null;
}

export function isRetryableAiError(err, signal) {
  if (!err || signal?.aborted || err.name === "AbortError") return false;
  if (err.code === "INVALID_API_KEY" || err.code === "SAFETY_BLOCK") return false;
  if (err.code === "MALFORMED_AI_OUTPUT" || err.code === "RATE_LIMIT") return true;

  const msg = String(err.message || "");
  return /timeout|timed out|503|502|500|UNAVAILABLE|JSON/i.test(msg);
}

export function waitWithAbort(ms, signal) {
  if (ms <= 0) {
    if (signal?.aborted) {
      const abortError = new Error("Generation was cancelled by the user");
      abortError.name = "AbortError";
      return Promise.reject(abortError);
    }
    return Promise.resolve();
  }

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

async function acquirePacedSlot({ signal, minGapMs = DEFAULT_MIN_REQUEST_GAP_MS } = {}) {
  const run = paceQueue.then(async () => {
    const now = Date.now();
    const targetTime = Math.max(nextAllowedRequestAt, rateLimitCooldownUntil);
    const waitMs = Math.max(0, targetTime - now);
    if (waitMs > 0) {
      await waitWithAbort(waitMs, signal);
    }
    nextAllowedRequestAt = Date.now() + minGapMs;
  });

  // Prevent a single aborted/rejected waiter from poisoning subsequent requests
  paceQueue = run.catch(() => {});
  return run;
}

export async function executeWithSingleRetry(
  runAttempt,
  {
    signal,
    retryDelayMs = 450,
    rateLimitDelayMs = DEFAULT_RATE_LIMIT_DELAY_MS,
    maxRateLimitRetries = 2,
    minGapMs = DEFAULT_MIN_REQUEST_GAP_MS,
    onRetry,
  } = {}
) {
  const maxAttempts = 1 + Math.max(1, maxRateLimitRetries);
  let lastError;
  let rateLimitAttempts = 0;
  let nonRateLimitAttempts = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (signal?.aborted) {
        const abortError = new Error("Generation was cancelled by the user");
        abortError.name = "AbortError";
        throw abortError;
      }

      await acquirePacedSlot({ signal, minGapMs });
      return await runAttempt(attempt);
    } catch (err) {
      const normalized = classifyAiError(err, signal);
      lastError = normalized;

      if (!isRetryableAiError(normalized, signal)) {
        throw normalized;
      }

      const isRateLimit = normalized.code === "RATE_LIMIT";
      let delayMs;

      if (isRateLimit) {
        rateLimitAttempts += 1;
        if (rateLimitAttempts > maxRateLimitRetries) {
          throw normalized;
        }
        const expDelay = rateLimitDelayMs * Math.pow(2, rateLimitAttempts - 1);
        const jitter = Math.floor(Math.random() * Math.min(400, Math.max(1, rateLimitDelayMs)));
        delayMs = Math.min(MAX_BACKOFF_MS, normalized.retryAfterMs || expDelay + jitter);
        rateLimitCooldownUntil = Math.max(rateLimitCooldownUntil, Date.now() + delayMs);
      } else {
        nonRateLimitAttempts += 1;
        if (nonRateLimitAttempts > 1) {
          throw normalized;
        }
        delayMs = retryDelayMs;
      }

      onRetry?.(normalized, attempt + 1);
      await waitWithAbort(delayMs, signal);
    }
  }

  throw lastError;
}
