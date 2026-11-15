export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getPlannerOverview } from "@/lib/server/studySets";

export async function GET() {
  try {
    const overview = await getPlannerOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (err) {
    console.error("Failed to load planner overview:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load planner overview" },
      { status: 500 }
    );
  }
}

