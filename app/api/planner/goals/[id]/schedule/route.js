export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getStudyGoalById,
  getStudySetById,
  addBulkChecklistItems,
} from "@/lib/server/studySets";
import { buildExamSchedule, toDateKey } from "@/lib/server/planner";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const goal = await getStudyGoalById(id);

    if (!goal) {
      return NextResponse.json({ error: "Study goal not found" }, { status: 404 });
    }

    let studySet = null;
    if (goal.study_set_id) {
      studySet = await getStudySetById(goal.study_set_id);
    }

    const tasks = buildExamSchedule({
      goal,
      studySet,
      todayStr: toDateKey(),
    });

    const created = await addBulkChecklistItems(tasks);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to auto-build exam schedule:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate exam schedule" },
      { status: 500 }
    );
  }
}

