# Data & Storage

StudyGold stores your study sets, flashcard ratings, quiz scores, and planner tasks. 

You can run it in two ways:
1. **Cloud Database (Supabase PostgreSQL)**: Best for permanent storage across devices.
2. **Local File Fallback (`.local-store.json`)**: Best for testing or running offline on your laptop with zero setup.

---

## How Automatic Fallback Works

The code in `lib/server/studySets.js` automatically checks if you provided Supabase credentials:

```mermaid
flowchart TD
    Request["API Request to read or write data"] --> CheckEnv{"Are SUPABASE_URL and<br>SERVICE_ROLE_KEY set in .env?"}
    CheckEnv -->|Yes| UseSupabase["Use Supabase PostgreSQL<br>(lib/server/supabase.js)"]
    CheckEnv -->|No| UseLocal["Use Local File Store<br>(lib/server/localStore.js writes to .local-store.json)"]
```

This means:
- You never get a crashed screen because you forgot to set up database keys.
- You can clone this project, run `npm run dev`, and start studying right away.

---

## The Database Tables (Simple Breakdown)

If you use Supabase, StudyGold creates these clean tables:

```mermaid
erDiagram
    STUDY_SETS ||--o{ FLASHCARDS : contains
    STUDY_SETS ||--o{ QUIZZES : contains
    STUDY_SETS ||--o{ QUIZ_ATTEMPTS : tracks
    STUDY_SETS ||--o{ STUDY_CHECKLIST : schedules
    EXAM_GOALS ||--o{ STUDY_SETS : links_to
    STUDY_SESSIONS ||--o{ STUDY_SETS : logs_time

    STUDY_SETS {
        uuid id PK
        string title
        text summary
        string source_type
        timestamp created_at
    }

    FLASHCARDS {
        uuid id PK
        uuid study_set_id FK
        text front
        text back
        string hint
        string mastery_level
        timestamp next_review_at
        float ease_factor
        int interval_days
    }

    QUIZZES {
        uuid id PK
        uuid study_set_id FK
        text question
        jsonb options
        int correct_index
        text explanation
    }

    QUIZ_ATTEMPTS {
        uuid id PK
        uuid study_set_id FK
        int score
        int total_questions
        jsonb answers
        timestamp created_at
    }

    STUDY_CHECKLIST {
        uuid id PK
        uuid study_set_id FK
        text task
        boolean is_completed
        date scheduled_date
        string priority
    }
```

### Table Details in Plain Words

1. **`study_sets`**: The main notebook. Holds the study set title, summary notes, and creation date.
2. **`flashcards`**: Every front/back card inside a study set. It also tracks your spaced repetition progress (how many days until you should see it again).
3. **`quizzes`**: Multiple-choice questions for each deck. Stores the 4 choices, which choice is correct (0, 1, 2, or 3), and a friendly explanation.
4. **`quiz_attempts`**: A record of every time you take a quiz. Shows how many points you scored and which questions you got wrong.
5. **`study_checklist`**: Small actionable tasks (e.g. "Review Chapter 3 formulas"). Each task has a due date and priority (`low`, `medium`, `high`).
6. **`exam_goals`**: Your upcoming exams, target dates, and readiness goal percentage.
7. **`study_sessions`**: Logs every time you use the Focus Timer (e.g. 25 minutes of studying), which keeps track of your daily study streak.

---

## Where to Find the SQL Migrations

The database setup scripts live in the `supabase/migrations/` folder:
- `20261108000000_create_study_tables.sql`: Core tables for sets, cards, quizzes, and checklist.
- `20261111000000_add_planner_features.sql`: Planner features, exam goals, and focus sessions.
