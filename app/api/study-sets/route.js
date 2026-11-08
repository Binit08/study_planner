export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listStudySets, createStudySet } from "@/lib/server/studySets";
import { StudySetSaveSchema } from "@/lib/schemas/studySet";

export async function GET() {
  try {
    const sets = await listStudySets();
    return NextResponse.json({ success: true, data: sets });
  } catch (err) {
    console.error("Failed to list study sets:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve study sets" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = StudySetSaveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || "Invalid study set payload",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const created = await createStudySet(validation.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to save study set:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save study set" },
      { status: 500 }
    );
  }
}
