export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateFlashcardProgress } from "@/lib/server/studySets";
import { ProgressUpdateSchema } from "@/lib/schemas/studySet";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const validation = ProgressUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid progress update payload" },
        { status: 400 }
      );
    }

    const updated = await updateFlashcardProgress(
      id,
      validation.data.cardIndex,
      validation.data.status
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Failed to update flashcard progress:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update flashcard progress" },
      { status: 500 }
    );
  }
}
