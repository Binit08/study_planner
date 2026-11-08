export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateChecklistItem, deleteChecklistItem } from "@/lib/server/studySets";
import { ChecklistUpdateSchema } from "@/lib/schemas/studySet";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const validation = ChecklistUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const updated = await updateChecklistItem(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Failed to update checklist item:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update checklist item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await deleteChecklistItem(id);
    return NextResponse.json({ success: true, message: "Checklist item deleted" });
  } catch (err) {
    console.error("Failed to delete checklist item:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete checklist item" },
      { status: 500 }
    );
  }
}
