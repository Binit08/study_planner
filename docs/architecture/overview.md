# How StudyGold Works (Architecture)

StudyGold is built as a single, clean Next.js application. Everything lives in one place: the user interface, the backend API endpoints, and the database connectors.

Here is a simple picture of how the whole system connects:

```mermaid
flowchart TD
    User["Student or User"] --> Browser["Web Browser - Next.js UI"]

    subgraph Frontend ["Next.js Frontend (React)"]
        Browser --> Pages["Pages: home, planner, flashcards, quizzes, history"]
        Pages --> Components["UI Components (Cards, Timer, Quiz Player)"]
    end

    subgraph Backend ["Next.js App Router (Backend APIs)"]
        Components -->|HTTP Fetch| API["API Routes"]
        API --> ServerLib["Server Libraries"]
        ServerLib --> AI["Google Gemini 2.5 Flash"]
        ServerLib --> Repo["Data Repositories"]
    end

    subgraph Storage ["Storage Layer"]
        Repo -->|If keys present| Supabase["Supabase (PostgreSQL Cloud)"]
        Repo -->|If no keys| LocalJSON["Local File (.local-store.json)"]
    end
```

---

## The Three Main Layers

### 1. The Frontend (What You See)
- Built with **React 18** and **Next.js 14 App Router**.
- Uses **Tailwind CSS** with custom paper-like styles (notebook dot grid, subtle paper borders, warm handwritten fonts like `Kalam` and `Patrick Hand`).
- Fast and responsive: flipping a card, filtering a list, or answering a quiz happens instantly in your browser without reloading the page.

### 2. The Backend (The Brain)
- Lives inside the `app/api/` folder.
- When you click "Generate Study Set", the browser sends your notes or PDF to `/api/generate`.
- The backend cleans up your input, sends a carefully written prompt to **Google Gemini 2.5 Flash**, verifies that the AI's reply is in the exact format needed, and saves the result.

### 3. The Storage Layer (Zero-Hassle Saving)
StudyGold has a smart fallback:
- **With Supabase:** If you provide your Supabase URL and key in `.env.local`, it stores your sets, card ratings, and quiz scores in PostgreSQL.
- **Without Supabase:** If you don't have a Supabase account yet, **it still works completely!** It writes all data safely to a file called `.local-store.json` on your computer.

---

## A Typical User Journey

```mermaid
sequenceDiagram
    autonumber
    actor User as Student
    participant UI as Browser (React)
    participant API as Backend (/api/generate)
    participant AI as Google Gemini
    participant DB as Storage (Supabase / Local)

    User->>UI: Pastes lecture notes or drops a PDF
    UI->>API: POST /api/generate
    API->>AI: Prompts Gemini with structured output rules
    AI-->>API: Returns summary, flashcards, and quizzes in JSON
    API->>API: Validates data with Zod (drops any broken card)
    API->>DB: Saves the clean study set
    DB-->>API: Saved study set with unique ID
    API-->>UI: Returns complete study set
    UI-->>User: Displays flashcards and quiz ready to play!
```
