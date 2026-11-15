# API Reference

All backend API endpoints in StudyGold live in `app/api/` and return JSON.

---

## 1. Study Set Generation

### `POST /api/generate`
Generates a new study set using Gemini 2.5 Flash from raw text or a PDF file.

- **Request Type:** `multipart/form-data` (if uploading a file) or `application/json`
- **Parameters:**
  - `content`: Plain text notes or syllabus.
  - `file`: PDF file (up to 15 MB).
  - `title`: Name for the study set (optional, AI will generate one if empty).
  - `cardCount`: Number of flashcards (5 to 25).
  - `quizCount`: Number of quiz questions (3 to 15).
  - `difficulty`: `'easy'`, `'medium'`, or `'hard'`.
  - `existingSet`: Optional JSON object of existing study set (for refinement).
  - `prompt`: Additional instructions for refinement.

---

## 2. Study Sets CRUD

### `GET /api/study-sets`
Fetches a list of all saved study sets.
- **Response:** Array of study set objects with card count, quiz count, and mastery rate.

### `GET /api/study-sets/[id]`
Fetches the full details of a single study set (summary, cards, quizzes, checklist, and attempts).

### `DELETE /api/study-sets/[id]`
Deletes a study set and all associated cards, quizzes, and tasks.

---

## 3. Flashcard Progress

### `POST /api/study-sets/[id]/progress`
Updates a card's mastery level and calculates its next spaced review date.
- **Request Body:**
  ```json
  {
    "cardId": "uuid-or-id",
    "masteryLevel": "mastered" // or "learning"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "cardId": "uuid-or-id",
    "masteryLevel": "mastered",
    "nextReviewAt": "2026-11-18T10:00:00.000Z"
  }
  ```

---

## 4. Quizzes & Attempts

### `POST /api/study-sets/[id]/attempts`
Saves the results of a quiz attempt.
- **Request Body:**
  ```json
  {
    "score": 8,
    "totalQuestions": 10,
    "answers": {
      "question-id-1": 2,
      "question-id-2": 0
    }
  }
  ```

### `GET /api/study-sets/[id]/attempts`
Returns the history of all previous quiz attempts for this deck.

---

## 5. Study Checklist

### `POST /api/checklist`
Creates a new checklist task.

### `PATCH /api/checklist`
Toggles whether a task is completed or updates its scheduled date.

### `DELETE /api/checklist`
Deletes a checklist task.

---

## 6. Planner, Goals & Focus Sessions

### `GET /api/planner/summary`
Returns high-level planner statistics:
- Current study streak in days.
- Number of flashcards due for review today.
- Tasks scheduled for this week.
- Upcoming exam countdowns.

### `POST /api/planner/goals`
Saves an upcoming exam goal and target readiness.

### `POST /api/planner/sessions`
Logs a completed focus timer session (e.g. 25 minutes) to record study activity and update streaks.

### `POST /api/planner/reschedule`
Moves all overdue, uncompleted checklist tasks forward to today.
