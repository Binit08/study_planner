export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateStudyGoal, deleteStudyGoal } from "@/lib/server/studySets";
import { StudyGoalUpdateSchema } from "@/lib/schemas/studySet";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = StudyGoalUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid study goal update" },
        { status: 400 }
      );
    }

    const updated = await updateStudyGoal(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: "Study goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Failed to update study goal:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update study goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await deleteStudyGoal(id);
    return NextResponse.json({ success: true, message: "Study goal deleted" });
  } catch (err) {
    console.error("Failed to delete study goal:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete study goal" },
      { status: 500 }
    );
  }
}

