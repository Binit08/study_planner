import "./globals.css";
import { Patrick_Hand, Kalam } from "next/font/google";
import Navbar from "@/components/ui/Navbar";

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-patrick-hand",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-kalam",
});

export const metadata = {
  title: "StudyGold | AI Study Assistant",
  description:
    "Transform messy notes and lecture PDFs into interactive flashcards, quizzes, and study plans with Google Gemini structured output.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${patrickHand.variable} ${kalam.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen text-[#2d2d2d] selection:bg-yellow-200">
        <div className="min-h-screen px-4 py-4 sm:px-6 md:px-8 md:py-6 max-w-7xl mx-auto flex flex-col justify-between">
          <div>
            <Navbar />
            <main>{children}</main>
          </div>

          {/* Hand-drawn Footer */}
          <footer className="mt-12 pt-6 pb-4 border-t-2 border-dashed border-[#2d2d2d]/25 text-center text-sm font-hand text-[#2d2d2d]/60">
            <span className="font-bold">StudyGold</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
