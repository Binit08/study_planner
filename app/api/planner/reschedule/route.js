export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { rescheduleOverdueTasks } from "@/lib/server/studySets";
import { toDateKey } from "@/lib/server/planner";

export async function POST() {
  try {
    const moved = await rescheduleOverdueTasks(toDateKey());
    return NextResponse.json({
      success: true,
      movedCount: moved.length,
      data: moved,
    });
  } catch (err) {
    console.error("Failed to reschedule overdue tasks:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reschedule overdue tasks" },
      { status: 500 }
    );
  }
}

