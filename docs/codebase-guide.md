# Complete Codebase Guide

This guide walks you through every folder and core file in StudyGold in simple, straightforward English. If you ever need to explain this project to a professor, colleague, or interviewer, this page gives you everything you need.

---

## Directory Map

```text
flam/
├── app/                  # Next.js App Router (pages and backend APIs)
├── components/           # Reusable React UI components
├── hooks/                # Custom React state hooks
├── lib/                  # Shared helper logic, database access, and AI rules
├── supabase/             # Database SQL migration files
├── tests/                # Automated unit and integration tests
└── docs/                 # Documentation (served with MkDocs)
```

---

## 1. The `app/` Directory (Pages & APIs)

Next.js 14 uses folder-based routing. Each folder with a `page.js` is a web page, and each folder under `api/` with a `route.js` is a backend API endpoint.

### Pages

| File | What it does |
| :--- | :--- |
| `app/page.js` | The home page. Displays the AI Study Generator and live preview. |
| `app/planner/page.js` | The Study Planner dashboard (weekly schedule, streaks, exam countdown). |
| `app/flashcards/page.js` | Standalone flashcard study page with deck selector. |
| `app/quizzes/page.js` | Standalone quiz page for testing yourself on any deck. |
| `app/history/page.js` | The library page showing all saved study decks with search and filters. |
| `app/study/[id]/page.js` | Workspace for one specific deck (combines notes, cards, quiz, timer). |
| `app/layout.js` | The root HTML layout (includes navigation bar and notebook fonts). |
| `app/error.js` | Friendly error page if something unexpected happens. |
| `app/globals.css` | Sketchbook styles, paper dot-grid, wobbly borders, and color definitions. |

### API Routes (`app/api/`)

| Route | Method | What it does |
| :--- | :--- | :--- |
| `app/api/generate/route.js` | `POST` | Accepts notes or PDF, prompts Gemini, parses JSON, and saves the new set. |
| `app/api/study-sets/route.js` | `GET` | Returns all saved study sets for the library page. |
| `app/api/study-sets/[id]/route.js` | `GET`, `DELETE` | Returns or deletes one specific study set. |
| `app/api/study-sets/[id]/progress/route.js` | `POST` | Updates whether a flashcard is "mastered" or "learning". |
| `app/api/study-sets/[id]/attempts/route.js` | `GET`, `POST` | Saves a completed quiz score or fetches past quiz attempts. |
| `app/api/checklist/route.js` | `POST`, `PATCH`, `DELETE` | Adds, checks off, or deletes tasks on your study checklist. |
| `app/api/planner/summary/route.js` | `GET` | Calculates review recommendations, streaks, and upcoming tasks. |
| `app/api/planner/goals/route.js` | `GET`, `POST`, `DELETE` | Manages exam target dates and auto-scheduled milestones. |
| `app/api/planner/sessions/route.js` | `POST` | Logs completed Focus Timer study sessions. |
| `app/api/planner/reschedule/route.js` | `POST` | Rolls all overdue tasks forward to today. |

---

## 2. The `components/` Directory (UI)

Components are organized by feature so it is easy to find what you are looking for:

### Generation (`components/generation/`)
- `GenerationForm.js`: The input form where you paste text or upload a PDF.
- `GenerationPreview.js`: Displays tabs for the generated summary, flashcards, quiz, and checklist.
- `GenerationSidebar.js`: Sidebar showing generator options and tips.
- `RefinementBar.js`: Chat bar to ask AI for edits and the "Undo" button.

### Flashcards (`components/flashcards/`)
- `FlashcardViewer.js`: The 3D flipping card, keyboard event listeners, hint display, and text-to-speech.
- `FlashcardControls.js`: Previous, next, shuffle, and audio buttons.

### Quiz (`components/quiz/`)
- `QuizPlayer.js`: The interactive quiz test interface with 1-4 key support.
- `QuizResults.js`: The score screen with explanations and the "Retest Mistakes" button.

### Planner (`components/planner/`)
- `WeeklySchedule.js`: 7-day calendar view with overdue task roller.
- `FocusTimer.js`: Pomodoro / focus countdown timer.
- `ExamGoalsPanel.js`: Exam countdown cards and milestone generator.
- `PlannerStats.js`: Summary statistics (current study streak, due reviews, completion %).
- `ReviewRecommendations.js`: Cards due for review today based on SM-2.

### Checklist & History
- `components/checklist/StudyChecklist.js`: Task checklist with checkboxes and priority badges.
- `components/history/StudySetCard.js`: Card preview in the library with delete confirmation.
- `components/study/StudyAttemptsList.js`: Table of previous quiz scores.
- `components/ui/Navbar.js`: Top navigation bar with links to all pages.

---

## 3. The `lib/` Directory (Helpers & Business Logic)

This is where the behind-the-scenes logic lives:

- `lib/server/ai.js`: Sets up the Google Gemini client and builds prompt strings.
- `lib/server/aiParser.js`: Extracts pure JSON from AI replies, drops invalid items, and validates against Zod schemas.
- `lib/server/aiRetry.js`: Retries failed AI calls once with feedback, respecting cancellation signals.
- `lib/server/pdf.js`: Uses `pdf-parse` to turn PDF file uploads into plain text.
- `lib/server/planner.js`: Calculates SM-2 spaced repetition dates, study streaks, and overdue tasks.
- `lib/server/scoring.js`: Grades quiz answers and extracts question IDs that were answered wrong.
- `lib/server/localStore.js`: File-backed storage (`.local-store.json`) when Supabase is not configured.
- `lib/server/supabase.js`: Supabase PostgreSQL client.
- `lib/server/repositories/`: Clean database access functions (`studySetRepo.js`, `checklistRepo.js`, `plannerRepo.js`).
- `lib/schemas/studySet.js`: Zod data validation schemas ensuring no broken data reaches the database.
- `lib/exportStudySet.js`: Formats study sets into Anki CSV and Markdown exports.
