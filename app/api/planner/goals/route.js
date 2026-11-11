export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listStudyGoals, addStudyGoal } from "@/lib/server/studySets";
import { StudyGoalCreateSchema } from "@/lib/schemas/studySet";

export async function GET() {
  try {
    const goals = await listStudyGoals();
    return NextResponse.json({ success: true, data: goals });
  } catch (err) {
    console.error("Failed to list study goals:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve study goals" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = StudyGoalCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid study goal payload" },
        { status: 400 }
      );
    }

    const created = await addStudyGoal(validation.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to create study goal:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create study goal" },
      { status: 500 }
    );
  }
}

