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
          <footer className="w-full border-t border-border-subtle/60 py-8 text-center text-xs text-text-tertiary">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Server-side Gemini Structured Output &bull; Supabase Postgres
              </span>
              <span>Flam AI Internship Engineering Demo</span>
            </div>
          </footer>
        </OrbBackground>
      </body>
    </html>
  );
}
