export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateStudyContent } from "@/lib/server/ai";
import { extractTextFromPdf } from "@/lib/server/pdf";
import { GenerationRequestSchema } from "@/lib/schemas/studySet";

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

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
      let formData;
      try {
        formData = await request.formData();
      } catch {
        return NextResponse.json(
          { error: "Invalid multipart form-data request.", code: "INVALID_MULTIPART" },
          { status: 400 }
        );
      }
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
        if (file.size > MAX_PDF_BYTES) {
          return NextResponse.json(
            {
              error: "Uploaded PDF exceeds the 15 MB size limit. Please upload a smaller file.",
              code: "FILE_TOO_LARGE",
            },
            { status: 413 }
          );
        }

        const isPdf =
          file.type === "application/pdf" ||
          (typeof file.name === "string" && file.name.toLowerCase().endsWith(".pdf"));
        if (!isPdf) {
          return NextResponse.json(
            {
              error: "Only PDF files are supported for document upload.",
              code: "INVALID_FILE_TYPE",
            },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const pdfResult = await extractTextFromPdf(buffer);
        
        // If user also provided text/notes, combine them so text acts as focus instructions
        if (textInput && String(textInput).trim().length > 0) {
          text = `PDF Document Content (${file.name}):\n${pdfResult.text}\n\nUser Focus Notes & Specific Syllabus Instructions:\n${String(textInput).trim()}`;
        } else {
          text = pdfResult.text;
        }

        sourceMeta = {
          type: "pdf",
          name: file.name,
          pages: pdfResult.numpages,
          truncated: pdfResult.isTruncated,
          hasUserNotes: Boolean(textInput && String(textInput).trim().length > 0),
        };
      } else if (textInput) {
        text = String(textInput).trim();
      }
    } else {
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON request body.", code: "INVALID_JSON" },
          { status: 400 }
        );
      }
      text = String(body.text || "").trim();
      mode = body.mode || "both";
      targetCount = body.targetCount || 6;
      refinementPrompt = body.refinementPrompt;
      existingSet = body.existingSet;
    }

    if (!text || text.length < 2) {
      return NextResponse.json(
        {
          error: "Source material too short. Please enter a topic (at least 2 characters), paste notes, or upload a PDF document.",
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
      text: validation.data.text,
      mode: validation.data.mode,
      targetCount: validation.data.targetCount,
      refinementPrompt: validation.data.refinementPrompt,
      existingSet: validation.data.existingSet,
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
        : err.code === "SAFETY_BLOCK" || err.code === "UNPROCESSABLE_PDF"
        ? 422
        : err.code === "INVALID_PDF" || err.code === "INVALID_JSON" || err.code === "VALIDATION_FAILED"
        ? 400
        : err.code === "MALFORMED_AI_OUTPUT"
        ? 502
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

