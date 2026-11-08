export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateStudyContent } from "@/lib/server/ai";
import { extractTextFromPdf } from "@/lib/server/pdf";
import { GenerationRequestSchema } from "@/lib/schemas/studySet";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let text = "";
    let mode = "both";
    let targetCount = 6;
    let refinementPrompt = null;
    let existingSet = null;
    let sourceMeta = { type: "text", name: null };

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const textInput = formData.get("text");
      const modeInput = formData.get("mode");
      const countInput = formData.get("targetCount");
      const refinementInput = formData.get("refinementPrompt");
      const existingSetJson = formData.get("existingSet");

      if (modeInput) mode = String(modeInput);
      if (countInput) targetCount = parseInt(String(countInput), 10) || 6;
      if (refinementInput) refinementPrompt = String(refinementInput);
      if (existingSetJson) {
        try {
          existingSet = JSON.parse(String(existingSetJson));
        } catch {
          // ignore parsing error
        }
      }

      if (file && typeof file === "object" && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const pdfResult = await extractTextFromPdf(buffer);
        text = pdfResult.text;
        sourceMeta = {
          type: "pdf",
          name: file.name,
          pages: pdfResult.numpages,
          truncated: pdfResult.isTruncated,
        };
      } else if (textInput) {
        text = String(textInput).trim();
      }
    } else {
      const body = await request.json();
      text = body.text || "";
      mode = body.mode || "both";
      targetCount = body.targetCount || 6;
      refinementPrompt = body.refinementPrompt;
      existingSet = body.existingSet;
    }

    if (!text || text.length < 10) {
      return NextResponse.json(
        {
          error: "Source material too short. Please provide at least 10 characters of notes, text, or a PDF document.",
          code: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    // Validate inputs
    const validation = GenerationRequestSchema.safeParse({
      text,
      mode,
      targetCount,
      refinementPrompt: refinementPrompt || undefined,
      existingSet: existingSet || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || "Invalid input parameters",
          details: validation.error.issues,
          code: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    const generated = await generateStudyContent({
      text,
      mode,
      targetCount,
      refinementPrompt,
      existingSet,
      signal: request.signal,
    });

    return NextResponse.json({
      success: true,
      data: generated,
      source: sourceMeta,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Generation was cancelled", code: "CANCELLED" },
        { status: 499 }
      );
    }

    console.error("AI Generation Error in Route Handler:", err);

    const status =
      err.code === "INVALID_API_KEY"
        ? 401
        : err.code === "RATE_LIMIT"
        ? 429
        : err.code === "SAFETY_BLOCK"
        ? 422
        : 500;

    return NextResponse.json(
      {
        error: err.message || "An unexpected error occurred during AI generation",
        code: err.code || "GENERATION_ERROR",
      },
      { status }
    );
  }
}
