export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listChecklistItems, addChecklistItem } from "@/lib/server/studySets";
import { ChecklistCreateSchema } from "@/lib/schemas/studySet";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studySetId = searchParams.get("studySetId");
    const items = await listChecklistItems(studySetId || null);
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("Failed to list checklist items:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve checklist items" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = ChecklistCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid checklist item" },
        { status: 400 }
      );
    }

    const created = await addChecklistItem(validation.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to create checklist item:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checklist item" },
      { status: 500 }
    );
  }
}
