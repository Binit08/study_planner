export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listStudySessions, addStudySession } from "@/lib/server/studySets";
import { StudySessionCreateSchema } from "@/lib/schemas/studySet";

export async function GET() {
  try {
    const sessions = await listStudySessions();
    return NextResponse.json({ success: true, data: sessions });
  } catch (err) {
    console.error("Failed to list study sessions:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve study sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = StudySessionCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid study session payload" },
        { status: 400 }
      );
    }

    const created = await addStudySession(validation.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to record study session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to record study session" },
      { status: 500 }
    );
  }
}

