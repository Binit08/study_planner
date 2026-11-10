# Flam Study Assistant

An interactive AI-powered study platform that transforms free-form notes and lecture PDFs into structured learning materials: **3D flip flashcards**, **auto-graded multiple-choice quizzes with explanations**, and **milestone checklists**.

Engineered for the Frontend Internship assignment with a heavy focus on **handling unpredictable AI output reliably**, **structured schema validation**, and **high-polish dark-mode UI/UX**.

---

## Visual Design & Aesthetics

The interface is built strictly in accordance with modern dark-mode geometric design principles:

* **Canvas Background:** Pure Black to Near-Black (`#000000` to `#0B0B0C`) with a subtle dot matrix overlay.
* **Surfaces:** Dark Translucent Gray (`#141416` / `rgba(255, 255, 255, 0.05)`) with faint borders (`#262629` / `rgba(255, 255, 255, 0.1)`) and backdrop glassmorphism (`backdrop-blur-md`).
* **Text Hierarchy:**
  * Primary: `#FFFFFF` (headings, tight tracking, medium-to-bold weights).
  * Secondary: `#A1A1AA` to `#B4B4B8` (body copy, relaxed line-height).
  * Tertiary: `#71717A` (captions, sub-labels, metadata).
* **Atmospheric Accents & Glows:** Soft radial gradient orbs blending Pale Yellow (`#FDE047`), Warm Amber (`#F59E0B`), and Sky Blue (`#38BDF8` to `#60A5FA`), connected by `#3F3F46` bezier lines.

---

## Tech Stack & Architecture

* **Framework:** Next.js (App Router, JavaScript only, no TypeScript, no `.ts`/`.tsx`).
* **AI Provider:** Google Gemini via the official `@google/genai` SDK (`gemini-2.5-flash`), called exclusively from server Route Handlers.
* **Runtime Validation:** Zod (`lib/schemas/studySet.js`) for exhaustive type-safety and response healing.
* **Database:** Supabase Postgres (`@supabase/supabase-js` service-role client on server) with zero-config local file store fallback (`.data/`) for immediate evaluation out of the box.
* **PDF Processing:** `pdf-parse` running exclusively in the Node.js runtime (`export const runtime = 'nodejs'`).
* **Styling:** Tailwind CSS with Lucide React icons.
* **Testing:** Node.js native test runner (`node --test`) for zero-overhead unit testing.

### Project Directory Structure

```
flam/
├── app/
│   ├── layout.js                     # Root layout with dark theme, ambient glow & navbar
│   ├── page.js                       # Hero flow, generation form & interactive preview
│   ├── flashcards/page.js            # Flashcard deck drill & active recall hub
│   ├── quizzes/page.js               # Self-test quiz hub with score history
│   ├── history/page.js               # Study set library with search and topic filters
│   ├── study/[id]/page.js            # Full dedicated study workspace
│   └── api/
│       ├── generate/route.js         # Node.js runtime handler for text & PDF extraction + Gemini
│       ├── study-sets/route.js       # List & create study sets
│       ├── study-sets/[id]/route.js  # Load & delete study sets
│       ├── study-sets/[id]/progress/route.js # Upsert card mastery (unseen/learning/mastered)
│       ├── study-sets/[id]/attempts/route.js # Quiz scoring & attempt persistence
│       └── checklist/route.js        # Checklist CRUD endpoints
├── components/
│   ├── ui/                           # Card, Badge, Navbar, OrbBackground
│   ├── generation/                   # GenerationForm, GenerationPreview, RefinementBar
│   ├── flashcards/                   # FlashcardViewer (3D flip, keyboard controls, filters)
│   ├── quiz/                         # QuizPlayer (options 1-4, score breakdown, re-test wrong)
│   ├── checklist/                    # StudyChecklist (task toggling & milestone tracking)
│   └── history/                      # StudySetCard
├── hooks/
│   └── useGeneration.js              # Client state, AbortController, stale-response protection
├── lib/
│   ├── schemas/studySet.js           # Zod schemas for all study domain models
│   └── server/
│       ├── ai.js                     # Gemini SDK integration marked `import "server-only"`
│       ├── pdf.js                    # PDF text extraction & sanitization
│       ├── supabase.js               # Supabase service role client
│       ├── studySets.js              # Persistence abstraction (Supabase + fallback)
│       └── scoring.js                # Quiz scoring & wrong-question isolation
├── supabase/
│   └── migrations/                   # SQL migration with RLS, foreign keys, triggers & indexes
└── tests/                            # Automated test suite for schemas, scoring, & parsing
```

---

## SOLID Principles Implementation

The codebase strictly follows the **SOLID** architectural design principles across frontend components and backend services:

* **S — Single Responsibility Principle (SRP):**
  * `lib/server/pdf.js`: Exclusively handles binary buffer validation, PDF text stream extraction, and whitespace sanitization.
  * `lib/server/ai.js`: Exclusively manages Google Gemini SDK communication, structured JSON schemas, and multi-stage JSON repair.
  * `lib/server/scoring.js`: Pure mathematical scoring, percentage calculation, and wrong-question isolation with zero side-effects.
  * `lib/schemas/studySet.js`: Single source of truth for runtime validation contracts using Zod.
  * `components/flashcards/FlashcardViewer.js`: Only handles flashcard rendering, 3D flip animation, and mastery state transitions.
  * `app/api/*`: Route Handlers act solely as HTTP transport controllers—parsing requests, validating inputs, delegating to services, and returning structured JSON.

* **O — Open/Closed Principle (OCP):**
  * Generation modes (`flashcards`, `quiz`, `both`) and study tools are open for extension without modifying core parsing infrastructure.
  * The AI output processor adapts to new study modalities by registering schemas rather than rewriting generation logic.

* **L — Liskov Substitution Principle (LSP):**
  * The storage repository in `lib/server/studySets.js` seamlessly swaps between remote Supabase Postgres and local `.data/` storage fallback while upholding identical method signatures and return shapes (`getAllStudySets`, `getStudySetById`, `createStudySet`, etc.). Route Handlers function identically regardless of which persistence backend is active.

* **I — Interface Segregation Principle (ISP):**
  * Client components declare focused, minimal prop contracts instead of monolithic objects:
    * `<FlashcardViewer cards progressMap onUpdateProgress title />`
    * `<QuizPlayer questions onSubmitAttempt title />`
    * `<StudyChecklist items onToggleItem onAddItem onDeleteItem />`
  * No component depends on handlers or data it does not utilize.

* **D — Dependency Inversion Principle (DIP):**
  * Route handlers depend on service abstractions (`lib/server/studySets.js`, `lib/server/scoring.js`), not raw database drivers.
  * Interactive UI components depend on callback abstractions (`onUpdateProgress`, `onSubmitAttempt`, `onToggleItem`) passed down from container components or unified hooks (`useGeneration`), decoupling the visual presentation from transport and storage layers.

---

## Handling Unpredictable AI Output (Core Evaluation Area)

Handling LLM failures cleanly is what separates production-ready software from fragile prototypes. Here is how this application addresses unpredictable model behavior:

| Failure Mode | Mitigation Strategy | Implementation |
|---|---|---|
| **Malformed JSON** | Markdown fence stripper + outermost bracket extractor + JSON sanitizer. | `lib/server/ai.js` (`extractJsonFromText`) |
| **Schema Deviation** | Zod runtime schema validation with an automated **repair / healing pass** before throwing errors. | `lib/schemas/studySet.js` & `lib/server/ai.js` |
| **Empty or Refused Responses** | Safety block classification, descriptive user messages, and clear retry triggers. | `app/api/generate/route.js` |
| **Stale Responses / Race Conditions** | Client tracks monotonic `requestId`s. If an older request resolves after a newer one was dispatched, it is automatically discarded. | `hooks/useGeneration.js` (`latestRequestIdRef`) |
| **User Cancellation** | `AbortController` aborts the in-flight HTTP request instantly on user click. | `hooks/useGeneration.js` (`cancel`) |
| **Rate Limits (429) & Quota Exceeded** | Detected via HTTP status and error string; surfaced with a friendly wait-and-retry card. | `lib/server/ai.js` |
| **Oversized / Image-Only PDFs** | Text extraction detects empty text layers (scanned documents) and caps input length to prevent token overflow. | `lib/server/pdf.js` (`extractTextFromPdf`) |

---

## Features

### 1. Active Recall Flashcards
* 3D card flipping with realistic perspective and sound/glow feedback.
* **Keyboard Navigation:** `Space` to flip, `←` / `→` arrows to navigate, `1` for "Needs Practice", `2` for "Mastered".
* Filter tabs: drill all cards, only cards needing review, or unseen cards.
* Real-time mastery bar updating progress across sessions.

### 2. Auto-Graded Quizzes with Wrong Answer Re-testing
* 4-option multiple choice questions with single-key shortcuts (`1`, `2`, `3`, `4`).
* Instant score calculation and pass/fail benchmark (>= 70%).
* **Targeted Mistake Re-testing:** A dedicated "Re-test Mistakes" button isolates only the questions the student got wrong, allowing targeted drilling without repeating mastered questions.
* Detailed post-quiz answer review with pedagogical explanations.

### 3. Stretch Goals Implemented
* **Multi-Block Output:** Gemini generates cards, questions, and an actionable study checklist.
* **Refinement Loop:** A dedicated refinement bar lets users provide follow-up prompts (e.g. *"make the quiz questions harder"*, *"add more practical examples"*) to edit the existing set without regenerating from scratch.
* **Session Persistence:** Save sets to Supabase Postgres (or local fallback storage) and resume anytime from `/history` or `/study/[id]`.
* **Mobile Responsiveness:** Touch-friendly card flipping and optimized layout on iOS and Android.

---

## Quick Start & Setup

### Prerequisites
* Node.js v18+ or v20+ (tested and verified on Node v25).
* npm v10+.

### 1. Clone & Install
```bash
git clone <repo-url>
cd flam
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to provide your Gemini API key (free tier available at [Google AI Studio](https://aistudio.google.com/)):
```env
# Google Gemini API
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
GEMINI_MODEL=gemini-2.5-flash

# Supabase Postgres (Optional for local testing; local file storage is used automatically if empty)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Run Development Server
```bash
npm start
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm test
```
Executes 10 unit tests verifying Zod schema validation, the quiz scoring engine, and JSON resilience.

### 5. Production Build
```bash
npm run build
npm run start:prod
```

---

## Database & Supabase Migrations

The database migration is located in `supabase/migrations/20261108000000_create_study_tables.sql`.

To apply to your Supabase project:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261108000000_create_study_tables.sql`.
3. Click **Run**.

### Schema Summary:
* `study_sets`: Stores title, topic, mode, source metadata, and structured JSON payloads for flashcards and quiz.
* `flashcard_progress`: Tracks mastery status per card index (`unseen`, `learning`, `mastered`) with foreign key cascading deletion and unique constraints.
* `quiz_attempts`: Tracks past scores, percentages, and submitted answer choices.
* `checklist_items`: Actionable study tasks linked to study sets.
* **RLS & Security:** Row Level Security is enabled on all tables without public/anonymous policies; privileged server Route Handlers access data via the `SUPABASE_SERVICE_ROLE_KEY`.

> **Note on Multi-User Support:** This implementation is configured for single-user evaluation without mandatory authentication. In a multi-user production environment, Supabase Auth (`auth.uid()`) should be added to table ownership columns alongside authenticated RLS policies.

---

## AI-Usage Disclosure

In accordance with the assignment instructions, here is an honest disclosure of how AI was used during this project:

* **Antigravity Coding Assistant:** Used as a pair-programmer to scaffold file structures, assist with CSS layout styling, write boilerplate Next.js Route Handlers, and generate initial test cases.
* **Human Architectural Decisions:** All critical architectural choices—including the choice of `@google/genai` official SDK, the multi-stage JSON repair strategy, the `requestId` stale-response prevention logic, the Supabase graceful fallback layer, and the quiz wrong-answer retest state machine—were deliberately designed to maximize reliability and resilience against edge-case failures.

---

## Known Limitations & Future Roadmap

1. **Scanned PDF OCR:** The current PDF parser extracts embedded text streams. For scanned or image-only documents, integrating Tesseract OCR or Gemini Vision multimodal input would provide full optical text recognition.
2. **Audio Pronunciation:** Active recall could be enhanced by integrating Web Speech API synthesis for flashcard pronunciation.
3. **Spaced Repetition System (SRS):** Implementing the SM-2 (SuperMemo-2) algorithm to automatically schedule flashcard reviews at optimal forgetting intervals.

---

## Time Spent

* Architecture, Schema Design & API Route Handlers: ~2 hours
* Google Gemini SDK Integration & Resilient Error Handling: ~2 hours
* Frontend UI, 3D Flashcard Flipping & Quiz Re-testing UX: ~2 hours
* Automated Tests, Documentation & Refinement: ~1 hour
* **Total Time:** ~7 hours
