import "./globals.css";
import Navbar from "@/components/ui/Navbar";

export const metadata = {
  title: "StudyGold | AI Study Assistant",
  description:
    "Transform messy notes and lecture PDFs into interactive flashcards, quizzes, and study plans with Google Gemini structured output.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-[#2d2d2d] selection:bg-yellow-200">
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col justify-between">
          <div>
            <Navbar />
            <main>{children}</main>
          </div>

          {/* Hand-drawn Footer */}
          <footer className="mt-16 pt-8 pb-4 border-t-2 border-dashed border-[#2d2d2d]/30 text-center text-base font-hand text-[#2d2d2d]/70">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-[#2d2d2d]" />
                Powered by Google Gemini 2.5 Structured Output &bull; Supabase Postgres
              </span>
              <span className="font-bold">StudyGold &bull; AI Learning Platform</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
