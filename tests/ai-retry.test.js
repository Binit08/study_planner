import { test, describe } from "node:test";
import assert from "node:assert";
import {
  classifyAiError,
  isRetryableAiError,
  executeWithSingleRetry,
} from "../lib/server/aiRetry.js";

describe("AI Retry & Error Classification", () => {
  test("classifyAiError maps 401, 429, and SAFETY errors to explicit codes", () => {
    const authErr = classifyAiError(new Error("Request failed: API_KEY_INVALID 401"));
    assert.strictEqual(authErr.code, "INVALID_API_KEY");
    assert.strictEqual(isRetryableAiError(authErr), false);

    const rateErr = classifyAiError(new Error("429 RESOURCE_EXHAUSTED"));
    assert.strictEqual(rateErr.code, "RATE_LIMIT");
    assert.strictEqual(isRetryableAiError(rateErr), true);

    const safetyErr = classifyAiError(new Error("Candidate was blocked by SAFETY"));
    assert.strictEqual(safetyErr.code, "SAFETY_BLOCK");
    assert.strictEqual(isRetryableAiError(safetyErr), false);
  });

  test("executeWithSingleRetry retries once on transient/malformed errors and succeeds", async () => {
    let calls = 0;
    const result = await executeWithSingleRetry(
      async () => {
        calls += 1;
        if (calls === 1) {
          const err = new Error("Bad schema");
          err.code = "MALFORMED_AI_OUTPUT";
          throw err;
        }
        return { ok: true };
      },
      { retryDelayMs: 1 }
    );

    assert.strictEqual(calls, 2);
    assert.deepStrictEqual(result, { ok: true });
  });

  test("executeWithSingleRetry does not retry non-retryable auth or abort errors", async () => {
    let authCalls = 0;
    await assert.rejects(
      () =>
        executeWithSingleRetry(
          async () => {
            authCalls += 1;
            throw new Error("401 UNAUTHENTICATED");
          },
          { retryDelayMs: 1 }
        ),
      (err) => err.code === "INVALID_API_KEY"
    );
    assert.strictEqual(authCalls, 1);

    const controller = new AbortController();
    controller.abort();
    let abortCalls = 0;
    await assert.rejects(
      () =>
        executeWithSingleRetry(
          async () => {
            abortCalls += 1;
            return "never";
          },
          { signal: controller.signal, retryDelayMs: 1 }
        ),
      (err) => err.name === "AbortError"
    );
    assert.strictEqual(abortCalls, 0);
  });
});

