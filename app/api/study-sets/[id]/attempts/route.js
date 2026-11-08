export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStudySetById, recordQuizAttempt } from "@/lib/server/studySets";
import { scoreQuizSubmission } from "@/lib/server/scoring";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { answers } = body; // Array of { questionIndex, selectedOptionIndex }

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Submitted answers must be an array" },
        { status: 400 }
      );
    }

    const studySet = await getStudySetById(id);
    if (!studySet) {
      return NextResponse.json({ error: "Study set not found" }, { status: 404 });
    }

    const quizQuestions = studySet.quiz || [];
    if (quizQuestions.length === 0) {
      return NextResponse.json(
        { error: "This study set has no quiz questions" },
        { status: 400 }
      );
    }

    const scoringResult = scoreQuizSubmission(quizQuestions, answers);

    const savedAttempt = await recordQuizAttempt(id, {
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
      answers: scoringResult.answers,
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: savedAttempt,
        scoreSummary: scoringResult,
      },
    });
  } catch (err) {
    console.error("Failed to record quiz attempt:", err);
    return NextResponse.json(
      { error: err.message || "Failed to record quiz attempt" },
      { status: 500 }
    );
  }
}
