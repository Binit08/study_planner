export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStudySetById, deleteStudySet } from "@/lib/server/studySets";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const studySet = await getStudySetById(id);

    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: studySet });
  } catch (err) {
    console.error("Failed to load study set:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load study set" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await deleteStudySet(id);
    return NextResponse.json({ success: true, message: "Study set deleted successfully" });
  } catch (err) {
    console.error("Failed to delete study set:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete study set" },
      { status: 500 }
    );
  }
}
