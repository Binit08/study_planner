# StudyGold — Handwritten AI Study Generator & Planner 📚

StudyGold is a friendly, smart study assistant and schedule planner built with Next.js 14 and Google Gemini AI. It has the warm look and feel of a hand-drawn paper notebook (`#fdfbf7` dot grid, wobbly borders, handwritten fonts), but behind the scenes it automatically turns your messy lecture notes or PDFs into ready-to-study flashcards, quizzes, checklists, and spaced repetition schedules.

> **Simple by Design:** 100% plain JavaScript (no complex TypeScript types). Works out-of-the-box with zero login required. If you don't connect a cloud database, it automatically saves everything directly in a local file on your computer.

---

## Architecture Diagram

Here is a visual map of how the entire system fits together:

```mermaid
flowchart TD
    User["Student or Browser"] --> UI["Next.js 14 Frontend (React 18)"]

    subgraph Pages ["Frontend Pages"]
        UI --> P1["/ (AI Study Generator)"]
        UI --> P2["/planner (Weekly Schedule and SM-2)"]
        UI --> P3["/flashcards (3D Card Viewer)"]
        UI --> P4["/quizzes (Quiz Player)"]
        UI --> P5["/history (Saved Decks Library)"]
        UI --> P6["/study/:id (Deck Workspace)"]
    end

    subgraph Backend ["Next.js App Router API Routes"]
        P1 --> API_Gen["/api/generate"]
        P2 --> API_Plan["/api/planner routes"]
        P3 --> API_Sets["/api/study-sets routes"]
        P4 --> API_Sets
        P5 --> API_Sets
        P6 --> API_Sets
        P2 --> API_Check["/api/checklist"]
        P6 --> API_Check
    end

    subgraph Logic ["Server Business Logic"]
        API_Gen --> AI_Pipeline["AI Pipeline (ai.js, aiParser.js, aiRetry.js)"]
        API_Gen --> PDF_Parser["PDF Parser (pdf.js)"]
        API_Plan --> Planner_Math["Planner Math (planner.js)"]
        API_Sets --> Scoring_Engine["Scoring Engine (scoring.js)"]
    end

    subgraph AI ["AI Cloud"]
        AI_Pipeline --> Gemini["Google Gemini 2.5 Flash"]
    end

    subgraph Storage ["Dual Storage Layer"]
        API_Sets --> Repos["Repositories"]
        API_Plan --> Repos
        API_Check --> Repos
        Repos --> Check{"Are Supabase keys configured?"}
        Check -->|Yes| Supabase["Supabase PostgreSQL"]
        Check -->|No - Default| LocalJSON["Local File: .local-store.json"]
    end
```

---

## How It Works in 3 Simple Diagrams

### 1. Generating Cards from Your Notes
```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Browser as Next.js UI
    participant Backend as API Route (/api/generate)
    participant Gemini as Google Gemini 2.5 Flash
    participant DB as Storage (Supabase or Local File)

    Student->>Browser: Pastes notes or uploads a PDF
    Browser->>Backend: POST /api/generate
    Backend->>Gemini: Sends notes and structured prompt
    Gemini-->>Backend: Returns JSON with summary, cards, quiz
    Backend->>Backend: Validates data (drops any broken items)
    Backend->>DB: Saves clean study set
    DB-->>Backend: Saved with unique ID
    Backend-->>Browser: Ready to study!
```

### 2. Spaced Repetition (SM-2) Flow
When you review cards, StudyGold calculates when you should see each card again based on how well you know it:

```mermaid
flowchart LR
    Card["Review Flashcard"] --> Answer{"Did you remember the answer?"}
    Answer -->|Still Learning| Reset["Reset review interval to 1 day<br>Review again tomorrow"]
    Answer -->|Mastered| Multiply["Increase interval by Ease Factor<br>1 day to 3 days to 6 days to 2 weeks"]
    Reset --> SaveRating["Update next_review_at date in database"]
    Multiply --> SaveRating
```

### 3. Taking a Quiz & Retesting Mistakes
```mermaid
flowchart TD
    Start["Take Quiz (10 Questions)"] --> Submit["Submit Answers"]
    Submit --> Grade["Grade answers and calculate score percentage"]
    Grade --> SaveAttempt["Save score to attempt history"]
    SaveAttempt --> Review["See results with explanations"]
    Review --> Choice{"Got any wrong?"}
    Choice -->|Yes| Retest["Click Retest Mistakes Only<br>Practice only missed questions"]
    Choice -->|No - 100 percent| Done["Done! Knowledge mastered"]
```

---

## Complete Codebase Breakdown

Here is what every file and folder in this project does, written in plain English:

### 1. `app/` (Pages and API Routes)
- **`app/page.js`**: The home page. Houses the AI Study Generator form and live preview.
- **`app/planner/page.js`**: The Study Planner dashboard with your weekly calendar, focus timer, and streak stats.
- **`app/flashcards/page.js`**: Standalone flashcard study page where you can pick any deck to flip through.
- **`app/quizzes/page.js`**: Standalone quiz page where you can take tests on your decks.
- **`app/history/page.js`**: The library of all your saved decks with search and filtering.
- **`app/study/[id]/page.js`**: A single deck's workspace combining notes, cards, quiz, and checklist in one view.
- **`app/globals.css`**: Handwritten notebook styling, paper dot grid, and soft shadows.
- **`app/api/generate/route.js`**: Handles AI study set creation from text or 15 MB PDF files.
- **`app/api/study-sets/`**: CRUD endpoints for fetching, updating, and deleting study sets.
- **`app/api/study-sets/[id]/progress/route.js`**: Saves whether a card is "mastered" or "learning".
- **`app/api/study-sets/[id]/attempts/route.js`**: Records quiz scores and retrieves past quiz attempts.
- **`app/api/checklist/route.js`**: Lets you add, check off, or delete study checklist tasks.
- **`app/api/planner/`**: Endpoints for weekly summary, exam goals, focus sessions, and rolling overdue tasks to today.

### 2. `components/` (User Interface)
- **`components/generation/`**:
  - `GenerationForm.js`: Input form for text/PDF upload with card count and difficulty controls.
  - `GenerationPreview.js`: Displays tabs for summary, flashcards, quiz questions, and checklist.
  - `RefinementBar.js`: Chat bar to ask AI for edits + instant Undo button.
- **`components/flashcards/`**:
  - `FlashcardViewer.js`: 3D flipping card, keyboard shortcuts (`Space`, `Arrows`, `H`, `M`, `L`), and audio read-aloud.
  - `FlashcardControls.js`: Next/previous buttons, shuffle button, and audio volume toggle.
- **`components/quiz/`**:
  - `QuizPlayer.js`: Interactive quiz taker with number keys `1–4` selection.
  - `QuizResults.js`: Scorecard showing detailed explanations and "Retest Mistakes" button.
- **`components/planner/`**:
  - `WeeklySchedule.js`: 7-day schedule with one-click "Roll Overdue to Today" button.
  - `FocusTimer.js`: Built-in Pomodoro/study timer with streak logger.
  - `ExamGoalsPanel.js`: Exam countdown cards and milestone generator.
  - `PlannerStats.js`: Cards showing current study streak and reviews due today.
- **`components/checklist/StudyChecklist.js`**: Interactive to-do checklist with priority tags.
- **`components/history/StudySetCard.js`**: Deck card in the library showing card count and mastery bar.

### 3. `lib/` (Helpers and Database)
- **`lib/server/ai.js`**: Google Gemini API client and prompt templates.
- **`lib/server/aiParser.js`**: Cleans up AI output, extracts pure JSON, and validates it with Zod.
- **`lib/server/aiRetry.js`**: Automatically retries if Gemini has a temporary hiccup.
- **`lib/server/pdf.js`**: Extracts plain text from uploaded PDF files safely.
- **`lib/server/planner.js`**: Spaced repetition (SM-2) math, study streaks, and overdue task calculations.
- **`lib/server/scoring.js`**: Compares quiz choices to correct answers and pulls out mistake questions.
- **`lib/server/localStore.js`**: Zero-config file storage (`.local-store.json`) when Supabase is not connected.
- **`lib/server/supabase.js`**: Supabase PostgreSQL client connection.
- **`lib/server/repositories/`**: Clean functions for reading and writing data without messy SQL in your routes.
- **`lib/schemas/studySet.js`**: Zod data rules that keep broken data out of your database.
- **`lib/exportStudySet.js`**: One-click download as Anki CSV or clean Markdown.

---

## Quickstart & Local Setup

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Set Up Your API Key
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and paste your free Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Optional: If you want to use Supabase, paste your Supabase URL and keys into `.env.local`. If you leave them blank, StudyGold automatically uses local file storage!)*

### 3. Start the Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run the Tests
```bash
npm test
```
All 28 automated tests will run and verify AI parsing, scoring, and storage.

---

## 📖 Usage Guide

StudyGold is designed to guide you through your entire study workflow—from converting raw notes into study materials, to active recall, self-testing, and spaced-repetition planning.

### 1. Generating a Study Set (`/`)
1. **Input Notes or Upload PDF**:
   - Paste lecture notes, bullet points, or syllabus topics directly into the text box, **or**
   - Upload a slide deck or textbook chapter PDF (up to 15 MB).
2. **Customize Settings**:
   - Enter a title (or let Gemini name it automatically).
   - Select your card count (5 to 30) and difficulty level (*Beginner*, *Intermediate*, or *Advanced*).
3. **Generate**: Click **"Generate Study Materials"**. Within seconds, Gemini generates:
   - 📝 **Executive Summary**: High-yield takeaways and core concepts.
   - 📇 **Flashcards**: Front/back cards with contextual hints.
   - ❓ **Multiple-Choice Quiz**: Questions with explanations for all options.
   - ✅ **Checklist**: Actionable milestones to guide your revision.
4. **Iterative AI Refinement**:
   - Use the **Refinement Bar** at the bottom to tweak the generated set (e.g., *"Make explanations simpler"*, *"Add 3 more questions on meiosis"*).
   - Use the **Undo** button to revert any refinement step immediately.

### 2. Studying with Flashcards (`/flashcards` or `/study/[id]`)
- **3D Card Flip**: Click the card or press `Space` to reveal the answer.
- **Keyboard Shortcuts**:
  - `Space` : Flip front / back
  - `←` / `→` : Previous / Next card
  - `H` : Toggle hint
  - `1` or `2` : Rate as **"Still Learning"** (schedules review again tomorrow via SM-2)
  - `3` : Rate as **"Mastered"** (expands review interval into the future)
- **Audio Read-Aloud**: Click the speaker icon to listen to questions and answers using browser Text-to-Speech (TTS).
- **Deck Filters**: Filter cards by *All*, *Due Today*, *Learning*, or *Mastered*.

### 3. Taking Quizzes & Drilling Mistakes (`/quizzes`)
1. **Interactive Test**: Answer multiple-choice questions using keyboard numbers `1`, `2`, `3`, `4` or mouse clicks. Navigate with `←` / `→`.
2. **Score & Feedback**: Submit to see your percentage score, letter grade, and detailed rationale for each answer.
3. **Retest Mistakes Only**: Click **"Retest Mistakes Only"** to immediately re-attempt only the questions you got wrong until you achieve 100% mastery.

### 4. Planning with Spaced Repetition (`/planner`)
- **Weekly Schedule**: View upcoming card reviews automatically scheduled by the **SuperMemo SM-2 algorithm**.
- **Roll Overdue to Today**: Missed a study session? One click rolls all overdue cards to today without breaking your streak.
- **Exam Countdown**: Set target exam dates to get milestone checklists and study pacing.
- **Focus Timer**: Use the built-in Pomodoro timer to log focused study minutes and maintain your daily streak.

### 5. Library & Exporting (`/history`)
- **Library Search**: Easily filter, search, and reopen any previously saved deck.
- **One-Click Export**:
  - 📥 **Anki (.csv)**: Ready for instant import into Anki desktop or mobile.
  - 📝 **Markdown (.md)**: Clean formatted text for Obsidian, Notion, or personal notes.

---

## 🤖 AI-Usage Note & Specifications

### 1. In-App AI Configuration

| Parameter | Configuration | Explanation |
| :--- | :--- | :--- |
| **Model** | `gemini-2.5-flash` | Fast, cost-efficient, high-reasoning model (configurable via `GEMINI_MODEL`) |
| **SDK** | `@google/genai` (v1beta) | Official Google Gen AI Node.js SDK |
| **Response Format** | `application/json` | Enforced structured JSON adhering to strict `Type.OBJECT` schema |
| **Temperature** | `0.3` (initial) / `0.2` (retry) | Low temperature to prevent hallucinations and enforce factual accuracy |
| **Max Output Tokens** | `8,192` tokens | Provides ample room for large sets (up to 30 cards + quizzes + checklists) |
| **Timeout & Retry** | `45s` timeout / 1 auto-retry | Self-healing fallback with retry and schema validation (`aiParser.js`) |

#### Token Usage & Economics
- **Typical Input Tokens**: ~500 to 3,500 tokens per generation (depending on length of lecture notes or uploaded PDF pages).
- **Typical Output Tokens**: ~800 to 2,200 tokens (summary, cards, quiz with explanations, and checklist).
- **Cost**: **100% Free** under Google AI Studio's free tier (up to 15 Requests/Min), or less than **$0.001 USD** per generation on pay-as-you-go.

### 2. AI Assistance Disclosure (Development)

In accordance with transparent AI-assisted development practices:
- **Tools Used**: Google Gemini / Antigravity Agent.
- **Areas of AI Assistance**:
  - Scaffolding Next.js 14 App Router boilerplate and Tailwind utility styles.
  - Implementing the SuperMemo SM-2 spaced repetition math formulas (`lib/server/planner.js`).
  - Generating initial unit test suites for scoring, parser healing, and local storage (`tests/`).
  - Speeding up custom CSS for the paper notebook aesthetic (dot grid `#fdfbf7`, wobbly borders).
- **Human Oversight & Verification**:
  - All AI-generated logic was reviewed, refactored, and tested against edge cases.
  - API routes and PDF uploads were tested with real files, with zero mock data in final runtime.

---

## ⚠️ Known Limitations

These limitations are straightforward and easy to explain:

1. **Digital PDFs Only (No OCR)**:
   - StudyGold parses selectable digital text from PDFs. If a user uploads a scanned photo or image-only PDF, text cannot be extracted unless it is run through an OCR tool first.
2. **Gemini Free-Tier Rate Limits**:
   - The free tier of Google AI Studio allows up to 15 requests per minute (RPM). Generating dozens of decks in rapid succession may trigger a short rate-limit cooldown.

3. **Internet Required for AI Features**:
   - Generating new study sets or chatting with the AI refinement bar requires an active internet connection to communicate with Google Gemini. (Reviewing already-saved decks works offline).
4. **Browser Text-to-Speech (TTS) Variations**:
   - The flashcard audio feature uses your web browser's built-in Web Speech API. Voice tone and accents vary depending on whether you are using Chrome, Safari, or Edge.

---

## ⏱️ Time Spent

**Total Time Spent:** Approximately **7 Hours**

| Stage | Time | Focus Areas |
| :--- | :---: | :--- |
| **1. Architecture & Setup** | ~1 hr | Project planning, Next.js 14 setup, Tailwind styling, dual-storage design (local JSON file fallback + Supabase). |
| **2. AI Pipeline & Backend** | ~1.5 hrs | Integrating Google Gemini (`@google/genai`), prompt engineering for high-yield study material, JSON schema enforcement, PDF parser, and self-healing parser with retry logic. |
| **3. Frontend & Paper UI** | ~2 hrs | Handwritten notebook design system (`globals.css`, dot grid, wobbly borders), 3D flipping flashcards with audio read-aloud, keyboard navigation, and interactive quiz player. |
| **4. Spaced Repetition & Planner** | ~1.5 hrs | Implementing the SuperMemo SM-2 algorithm, 7-day study calendar, "Roll Overdue to Today" logic, exam countdowns, and Pomodoro focus timer. |
| **5. Testing & Documentation** | ~1 hr | Writing 28 automated tests (Vitest/Jest), setting up interactive MkDocs documentation, and creating comprehensive README documentation. |

---

## Interactive Documentation (MkDocs)

StudyGold includes a full interactive documentation site built with **MkDocs**:

1. **Install MkDocs** (if needed):
   ```bash
   pip install mkdocs mkdocs-material
   ```

2. **Serve the Documentation Locally**:
   ```bash
   mkdocs serve
   ```
   Open [http://127.0.0.1:8000](http://127.0.0.1:8000) to view the documentation with live search, navigation tabs, and dark/light mode.
