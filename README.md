# StudyGold — Handwritten AI Study Generator & Planner

StudyGold is a full-stack, single-tenant Next.js 14 study assistant and planner built around a warm light sketchbook aesthetic (`#fdfbf7` dot-paper background, handwritten `Kalam` / `Patrick Hand` typography, wobbly hand-drawn borders, and crisp hard shadows). Paste lecture notes, enter syllabus topics, or upload PDFs to generate flashcards, multiple-choice quizzes, and actionable study checklists powered by Google Gemini, then schedule reviews and exam milestones in the built-in Study Planner.

> **Language & Scope:** Plain JavaScript only (no TypeScript). Single-tenant workspace with no user authentication required.

---

## Key Features

### 1. AI Study Generator & Refinement Loop (`/`)
- **Dual Input Modes:** Paste raw notes/topics or upload PDFs (up to 15 MB, server-parsed via `pdf-parse` with automatic length capping).
- **Structured Output & Validation:** Uses `@google/genai` structured JSON output validated by Zod (`lib/server/aiParser.js`), dropping malformed items instead of fabricating fake options and automatically retrying once on transient/schema failures.
- **In-Context Refinement & Undo:** Iterative refinement sends existing summary, flashcards, and quizzes to Gemini so edits preserve strong cards, backed by a client-side undo stack (`GenerationPreview.js`).
- **One-Click Exports:** Export decks to 2-column Anki `.csv` or copy full Markdown to clipboard.

### 2. Study Planner, SM-2 Spaced Repetition & Focus Timer (`/planner`)
- **Weekly Schedule & Overdue Rescheduler:** View, create, edit priority/duration, and roll overdue tasks forward to today (`/api/planner/reschedule`).
- **SM-2 Spaced Repetition:** Rating cards (`mastered` vs `learning`) computes `next_review_at`, `interval_days`, and `ease_factor` (`lib/server/planner.js`) to surface decks due for review.
- **Exam Goals & Auto-Schedule Builder:** Set target exam dates, readiness targets, and optionally auto-generate distributed checklist milestones up to exam day (`/api/planner/goals`).
- **Focus Timer & Study Streaks:** Built-in countdown timer (`components/planner/FocusTimer.js`) logs completed focus sessions (`/api/planner/sessions`) and tracks consecutive study streaks.

### 3. Interactive Study Modes (`/flashcards`, `/quizzes`, `/history`, `/study/[id]`)
- **3D Flashcard Deck (`FlashcardViewer.js`):** Keyboard navigation (`Space`/`Enter` to flip, arrows to move, `H` for clue, `M`/`L` to rate), filter tabs, card shuffling, and Web Speech API read-aloud.
- **Interactive Quiz Player (`QuizPlayer.js`):** Number keys `1–4` selection, inline incomplete-submit confirmation, score persistence, and targeted mistake-only retesting without overwriting full-quiz attempt stats.
- **Library & Deck Workspace (`/history`, `/study/[id]`):** Search, topic filtering, sort modes, study checklist editing, inline delete confirmation, and embedded Focus Timer.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, JavaScript (`.js`)
- **Styling:** Tailwind CSS + custom sketchbook CSS utilities (`app/globals.css`)
- **AI:** `@google/genai` (`gemini-2.5-flash` default)
- **PDF Parsing:** `pdf-parse`
- **Validation:** `zod` (`lib/schemas/studySet.js`)
- **Database:** Supabase PostgreSQL (`@supabase/supabase-js`) with automatic local JSON fallback (`lib/server/localStore.js`) when Supabase env vars are absent

---

## Architecture Overview

```text
app/
├── page.js                       # Study generator workspace
├── error.js                      # Global Next.js error boundary
├── planner/page.js               # Study Planner dashboard
├── flashcards/page.js            # Standalone flashcard deck selector
├── quizzes/page.js               # Standalone quiz selector
├── history/page.js               # Saved study library & filters
├── study/[id]/page.js            # Individual study deck workspace
└── api/
    ├── generate/route.js         # AI generation & 15 MB PDF guard
    ├── study-sets/               # CRUD, progress & quiz attempts
    ├── checklist/                # Study checklist task CRUD
    └── planner/                  # Planner summary, goals, sessions, reschedule

components/
├── checklist/                    # StudyChecklist.js
├── flashcards/                   # FlashcardViewer, FlashcardControls
├── generation/                   # GenerationForm, GenerationPreview, GenerationSidebar, RefinementBar
├── history/                      # StudySetCard.js
├── planner/                      # PlannerStats, WeeklySchedule, ReviewRecommendations, ExamGoalsPanel, FocusTimer
├── quiz/                         # QuizPlayer, QuizResults
├── study/                        # StudyAttemptsList.js
└── ui/                           # Navbar.js, FormattedContent.js

lib/
├── exportStudySet.js             # Shared Anki CSV & Markdown export helpers
├── schemas/studySet.js           # Zod schemas for AI, sets, goals, checklist, sessions
└── server/
    ├── ai.js                     # Gemini client & prompt builder
    ├── aiParser.js               # Pure JSON extractor, Zod validator & safe healing
    ├── aiRetry.js                # Abort-aware single retry & error classification
    ├── pdf.js                    # PDF buffer text extraction
    ├── planner.js                # SM-2 scheduling, streak & summary calculations
    ├── scoring.js                # Quiz grading & mistake extraction
    ├── localStore.js             # File-backed fallback store (.local-store.json)
    ├── supabase.js               # Server Supabase client
    ├── studySets.js              # Barrel exports for repositories
    └── repositories/
        ├── studySetRepo.js       # Study set, flashcard progress & quiz attempts
        ├── checklistRepo.js      # Checklist & planner task persistence
        └── plannerRepo.js        # Exam goals & focus sessions

supabase/migrations/
├── 20261108000000_create_study_tables.sql
└── 20261111000000_add_planner_features.sql
```

---

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables (`.env.local`):**
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash

   # Optional: Supabase PostgreSQL (falls back to .local-store.json if omitted)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Apply Supabase SQL migrations (if using Supabase):**
   Run the SQL files in `supabase/migrations/` in chronological order in your Supabase SQL Editor or via Supabase CLI.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Testing & Verification

Run ESLint checks (`0` warnings / errors):
```bash
npm run lint
```

Run the built-in Node test suite (`28` unit tests across `7` suites):
```bash
npm test
```

Run the production build check:
```bash
npm run build
```
