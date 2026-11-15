# Quizzes & Scoring

StudyGold lets you test your recall with interactive multiple-choice quizzes generated from your notes.

You can access quizzes at:
- **Dedicated Quizzes page (`/quizzes`):** Select any saved deck to test yourself.
- **Inside any study set workspace (`/study/[id]`):** Take quizzes in the study workspace.

---

## Taking a Quiz

When taking a quiz:
- Select choices with your mouse or press numbers `1`, `2`, `3`, or `4` on your keyboard.
- Track your progress with the step counter at the top (e.g. "Question 3 of 10").
- If you click "Submit Quiz" before answering all questions, StudyGold asks for confirmation so you don't accidentally submit an incomplete attempt.

---

## Instant Results & Explanations

When you finish, the **Quiz Results** screen shows:
- **Your Score:** Percentage and count (e.g., "8 / 10 (80%)").
- **Question Breakdown:** Every question is shown with green highlighting for the correct answer and red highlighting if you picked the wrong choice.
- **AI Explanations:** A concise explanation helps you understand *why* the right answer is correct.

---

## Retesting Only Mistakes

One of the best study features is **"Retest Mistakes"**:
- Instead of redoing all 10 or 20 questions, you can click **"Retest Mistakes Only"**.
- StudyGold filters out the questions you already got right and immediately gives you a focused quiz containing *only* the questions you missed.
- Your official full-quiz score remains safely recorded in your history, so retesting mistakes does not ruin your stats!

---

## How Scores Are Calculated (`lib/server/scoring.js`)

The scoring engine is clean and predictable:
1. Compares each selected choice index to the question's `correct_index`.
2. Calculates:
   $$\text{Score \%} = \frac{\text{Correct Answers}}{\text{Total Questions}} \times 100$$
3. Identifies the list of question IDs that were answered incorrectly.
4. Saves the attempt to the database via `/api/study-sets/[id]/attempts`.

---

## Related Files in Code

| File | Purpose |
| :--- | :--- |
| `components/quiz/QuizPlayer.js` | The interactive test player (questions, choices, keyboard shortcuts). |
| `components/quiz/QuizResults.js` | The scorecard showing score, explanations, and "Retest Mistakes" button. |
| `components/study/StudyAttemptsList.js` | History list of your previous quiz scores and dates. |
| `lib/server/scoring.js` | Simple grading logic and mistake extractor. |
| `app/quizzes/page.js` | Standalone quiz page. |
