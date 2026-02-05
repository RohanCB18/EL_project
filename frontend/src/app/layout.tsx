import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyGenius - AI PDF Study Companion",
  description: "AI-powered PDF study companion for students and teachers. Ask questions, generate summaries, quizzes, and professional question papers.",
  keywords: "PDF, AI, study, learning, quiz, question paper, teacher, student, education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="blob-primary top-[-200px] right-[-100px]" />
          <div className="blob-accent bottom-[100px] left-[-150px]" />
        </div>

        <Navbar />
        <main className="min-h-screen pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
