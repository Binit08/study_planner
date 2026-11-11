/**
 * Pure formatters and browser helpers for exporting study sets to Anki CSV and Markdown.
 */

export function buildAnkiCsv(flashcards = []) {
  if (!Array.isArray(flashcards) || flashcards.length === 0) return "";
  const rows = [
    "#separator:comma",
    "#html:false",
    ...flashcards.map((card) => {
      const front = `"${String(card.front || "").replace(/"/g, '""')}"`;
      const back = `"${String(card.back || "").replace(/"/g, '""')}"`;
      return `${front},${back}`;
    }),
  ];
  return rows.join("\n");
}

export function buildAnkiFilename(title = "study-set") {
  return `${String(title || "study-set")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")}-anki.csv`;
}

export function downloadAnkiCsv(flashcards, title) {
  const csv = buildAnkiCsv(flashcards);
  if (!csv || typeof document === "undefined") return;
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", buildAnkiFilename(title));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function buildStudySetMarkdown({
  title = "Study Set",
  topic = "General",
  summary = "",
  flashcards = [],
  quiz = [],
  checklist = [],
}) {
  let md = `# ${title || "Study Set"}\nTopic: ${topic || "General"}\n\n`;
  if (summary) md += `> ${summary}\n\n`;

  if (Array.isArray(flashcards) && flashcards.length > 0) {
    md += `## 📚 Flashcards (${flashcards.length})\n\n`;
    flashcards.forEach((card, idx) => {
      md += `### Card ${idx + 1}\n**Q:** ${card.front}\n**A:** ${card.back}\n\n`;
    });
  }

  if (Array.isArray(quiz) && quiz.length > 0) {
    md += `## 📝 Quiz Assessment (${quiz.length} Questions)\n\n`;
    quiz.forEach((q, idx) => {
      md += `### Q${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        const isCorrect = oIdx === q.correctAnswerIndex;
        md += `- [${isCorrect ? "x" : " "}] ${opt}${isCorrect ? " *(Correct)*" : ""}\n`;
      });
      if (q.explanation) md += `\n*Explanation:* ${q.explanation}\n\n`;
    });
  }

  if (Array.isArray(checklist) && checklist.length > 0) {
    md += `## ✅ Mastery Checklist\n\n`;
    checklist.forEach((item) => {
      md += `- [${item.completed ? "x" : " "}] ${item.task}\n`;
    });
  }

  return md;
}

