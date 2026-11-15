# AI Study Generator

The Study Generator lives on the home page (`/`). It is the primary tool for creating new study material.

---

## 1. Input Options

You have two easy ways to give StudyGold your study materials:

1. **Text Tab:** Paste your notes, lecture transcript, key terms, or book chapter directly into the box.
2. **PDF Upload Tab:** Drag and drop any PDF file up to **15 MB**. StudyGold parses the text on the server using `pdf-parse` without you having to convert it manually.

---

## 2. Choosing Your Options

Before clicking Generate, you can configure:
- **Title:** Name your deck (e.g. "Biology 101 - Cell Respiration").
- **Card Count:** Choose between 5 to 25 flashcards.
- **Quiz Questions:** Choose how many multiple-choice questions you want.
- **Difficulty:** Select `Easy`, `Medium`, or `Hard` to guide the depth of the questions.

---

## 3. The Preview & Refinement Bar

Once generated, you will see your new deck immediately in the **Generation Preview**:
- Read the high-level **Summary**.
- Flip through the **Flashcards**.
- Check the **Quiz Questions**.
- Review the auto-generated **Study Checklist**.

If you want changes, type instructions into the **Refinement Bar** at the bottom (e.g., *"Add more definitions"* or *"Make the quiz trickier"*). 
- If you don't like the new changes, click **Undo** to restore the previous version instantly.

---

## 4. Exporting Your Cards

StudyGold makes it easy to take your cards anywhere:

- **Export to Anki (.csv):** Downloads a clean 2-column CSV file (`Front`, `Back`) ready to import directly into the popular Anki flashcard app.
- **Copy as Markdown:** Copies all notes, cards, and quizzes into your clipboard as clean Markdown formatted text, perfect for pasting into Notion, Obsidian, or Google Docs.

---

## Related Files in Code

| File | Purpose |
| :--- | :--- |
| `app/page.js` | Main page that puts together the form and the live preview. |
| `components/generation/GenerationForm.js` | Form with text box, PDF upload, and options. |
| `components/generation/GenerationPreview.js` | Live preview showing tabs for summary, cards, quiz, and checklist. |
| `components/generation/RefinementBar.js` | The input bar for asking AI to edit or expand existing cards. |
| `lib/exportStudySet.js` | Helper functions for generating Anki CSVs and Markdown text. |
