# Welcome to StudyGold 📚

**StudyGold** is a simple, smart study assistant built with Next.js and Google Gemini AI. It looks like a warm paper notebook, but it helps you study much faster by doing the heavy lifting for you.

You can paste your lecture notes or upload a PDF, and StudyGold will instantly turn it into:
- 💡 **Summary**: Easy-to-read bullet points and quick takeaways.
- 📇 **Flashcards**: Interactive cards with hints, flips, and read-aloud voice.
- ❓ **Quizzes**: Multiple-choice questions with instant scoring and explanations.
- ✅ **Checklists**: Clear step-by-step to-do lists for your study sessions.
- 📅 **Study Planner**: A weekly schedule that uses spaced repetition (SM-2) so you remember things right before an exam.

---

## Why StudyGold?

Studying can feel overwhelming when you have hundreds of pages of slides and notes. StudyGold solves three simple problems:

1. **Making study material takes too long:** Instead of spending 2 hours writing flashcards, AI creates them in 10 seconds.
2. **Reviewing without a plan is ineffective:** The built-in planner schedules reviews based on how well you know each card.
3. **No complicated setup:** You don't even need a database or login to start. If you don't connect Supabase, it automatically saves everything directly in a local file on your computer.

---

## Quick Tour of the Features

| Page | What you do here |
| :--- | :--- |
| **Generator (`/`)** | Paste notes or upload a PDF to generate a new study set. You can also chat with the AI to refine or edit the cards. |
| **Planner (`/planner`)** | View your weekly study tasks, set exam target dates, and use the focus timer. |
| **Flashcards (`/flashcards`)** | Pick a deck and flip through flashcards using keyboard keys or clicks. |
| **Quizzes (`/quizzes`)** | Take quizzes to test your knowledge, see your score, and re-test only the questions you got wrong. |
| **Library (`/history`)** | See all your saved study sets, search by topic, and export to Anki or Markdown. |

---

## How to Navigate This Documentation

- **[System Overview](architecture/overview.md)**: A friendly bird's-eye view of how the frontend, backend, and AI talk to each other.
- **[Data & Storage](architecture/database-storage.md)**: How your study data is saved (both in Supabase and the local file fallback).
- **[AI Pipeline](architecture/ai-pipeline.md)**: How Google Gemini turns your notes into structured cards and quizzes.
- **[Codebase Guide](codebase-guide.md)**: A simple walkthrough explaining every folder and file in plain English.
- **[Getting Started](guide/setup-and-run.md)**: How to run the project and this documentation on your laptop.
