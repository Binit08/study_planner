import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import OrbBackground from "@/components/ui/OrbBackground";

export const metadata = {
  title: "Flam Study Assistant — AI Structured Learning with Google Gemini",
  description:
    "Transform unstructured notes and PDFs into interactive flashcards, quizzes, and study checklists with Google Gemini structured output and Supabase Postgres persistence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-text-primary min-h-screen">
        <OrbBackground>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>
          <footer className="w-full border-t border-border-subtle/50 py-6 text-center text-xs text-text-tertiary">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface border border-border-subtle text-text-secondary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Gemini 2.5 Structured Output
              </span>
              <span>&bull;</span>
              <span>Supabase Postgres</span>
              <span>&bull;</span>
              <span className="text-text-secondary">Flam Study Assistant</span>
            </div>
          </footer>
        </OrbBackground>
      </body>
    </html>
  );
}
