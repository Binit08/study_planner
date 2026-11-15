# Flashcard Viewer

The Flashcard Viewer lets you review your cards with an interactive 3D flip animation, keyboard shortcuts, and text-to-speech audio.

You can use flashcards in two places:
1. **Directly on the Flashcards page (`/flashcards`):** Pick any deck from your library.
2. **Inside any study set workspace (`/study/[id]`):** Study your cards side-by-side with your notes.

---

## Interactive Controls

The flashcard viewer is designed to be used without touching your mouse so you can study faster:

| Action | Shortcut / Click | What it does |
| :--- | :--- | :--- |
| **Flip Card** | `Space` or `Enter` (or click card) | Flips the card between question (Front) and answer (Back). |
| **Next Card** | `→` Right Arrow | Moves to the next card in the deck. |
| **Previous Card** | `←` Left Arrow | Moves to the previous card. |
| **Show Hint** | `H` key (or click "Hint") | Reveals a subtle clue to jog your memory before flipping. |
| **Read Aloud** | Audio button (🔊) | Uses your browser's speech synthesis to read the card out loud. |
| **Shuffle** | Shuffle button (🔀) | Randomizes the card order so you don't memorize them by position. |

---

## Rating Your Knowledge

At the bottom of each card, you rate how well you knew the answer:

- **"Still Learning" (Red/Yellow or `L` key):** Marks the card as needing more practice. The spaced repetition planner will schedule this card to be reviewed again soon (e.g. tomorrow).
- **"Mastered" (Green or `M` key):** Marks the card as known. The planner will increase the review interval so you only review it after several days.

Your rating is saved automatically to the database via `/api/study-sets/[id]/progress`.

---

## Filter Tabs

Above the card deck, you can filter which cards to see:
- **All Cards:** Review the entire deck.
- **Still Learning:** Only shows cards you have struggled with.
- **Mastered:** Only shows cards you have already learned well.

---

## Related Files in Code

| File | Purpose |
| :--- | :--- |
| `components/flashcards/FlashcardViewer.js` | Main interactive 3D card deck, keyboard listeners, speech synthesis, and state handling. |
| `components/flashcards/FlashcardControls.js` | Next/Prev buttons, shuffle button, audio button, and counter. |
| `app/flashcards/page.js` | Dedicated page for selecting and playing decks. |
