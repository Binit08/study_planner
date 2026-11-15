# Library & Study Workspace

StudyGold organizes all your created decks in one place so you can revisit, edit, and practice them anytime.

---

## 1. Saved Decks Library (`/history`)

The Library page displays every study set you have ever generated:
- **Search Bar:** Quickly find decks by keyword or topic.
- **Sorting Options:** Sort decks by *Newest*, *Oldest*, *Highest Mastery*, or *Most Cards*.
- **Quick Stats:** Each card displays how many flashcards it contains, how many quiz questions it has, and your current mastery percentage.
- **Export & Delete:** One-click Anki CSV download, Markdown copy, and safe deletion with confirmation.

---

## 2. Individual Study Workspace (`/study/[id]`)

Clicking on any study set opens its dedicated workspace page. This is your personal dashboard for that specific topic:

```
+-----------------------------------------------------------+
| Title: Data Structures - Binary Trees                     |
| Created: Nov 12 • 15 Cards • 5 Quiz Questions             |
+-----------------------------------------------------------+
| [Notes Summary]   [Flashcards]   [Quiz]   [Checklist]     |
|                                                           |
| (Selected Tab Content: interactive cards, test, etc.)     |
|                                                           |
+-----------------------------------------------------------+
| [Embedded Focus Timer]    [Quiz Attempt History (80%, 90%)]|
+-----------------------------------------------------------+
```

Inside this workspace, you can:
1. Review the full AI-generated summary notes.
2. Practice the flashcards with audio read-aloud and keyboard flips.
3. Take the quiz and view past test scores in the attempt log.
4. Add, edit, or check off study tasks on the checklist.
5. Run the Focus Timer without leaving the page.

---

## Related Files in Code

| File | Purpose |
| :--- | :--- |
| `app/history/page.js` | Library page with search, filters, and deck cards. |
| `app/study/[id]/page.js` | Full workspace for a single study set. |
| `components/history/StudySetCard.js` | Card showing deck preview, stats, and delete confirmation. |
| `components/checklist/StudyChecklist.js` | Interactive checklist where you can toggle, add, or delete tasks. |
| `components/study/StudyAttemptsList.js` | Table of past quiz scores and dates for this deck. |
