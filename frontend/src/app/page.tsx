import Link from "next/link";
import { Search, FileText, CheckSquare, Star, GraduationCap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center animate-fadeIn">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-full text-base mb-6">
            <span className="text-xl">✨</span>
            <span className="text-muted-foreground font-medium">AI-Powered Learning Companion</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Transform Your PDFs Into
            <span className="block text-primary">Interactive Knowledge</span>
          </h1>

          {/* Description */}
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Upload any PDF and unlock its potential with AI. Ask questions, generate summaries,
            create practice quizzes, and produce professional question papers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link href="/student" className="btn btn-primary text-base px-6 py-3">
              <GraduationCap className="w-5 h-5" />
              I&apos;m a Student
            </Link>
            <Link href="/teacher" className="btn btn-accent text-base px-6 py-3">
              <Users className="w-5 h-5" />
              I&apos;m a Teacher
            </Link>
          </div>
        </div>

        {/* Feature Cards - Below Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          <FeatureCard
            icon={<Search className="w-5 h-5" />}
            title="Smart Q&A"
            description="Ask questions about your PDFs and get accurate, context-aware answers instantly"
            color="primary"
          />
          <FeatureCard
            icon={<FileText className="w-5 h-5" />}
            title="Auto Summaries"
            description="Generate concise summaries that capture the key points of any document"
            color="accent"
          />
          <FeatureCard
            icon={<CheckSquare className="w-5 h-5" />}
            title="Practice Quizzes"
            description="Create interactive quizzes to test your understanding and reinforce learning"
            color="primary"
          />
          <FeatureCard
            icon={<Star className="w-5 h-5" />}
            title="Question Papers"
            description="Teachers can generate professional exam papers with downloadable PDFs"
            color="accent"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "accent";
}) {
  return (
    <div className="glass rounded-2xl p-5 hover:-translate-y-1 transition-all cursor-default">
      <div className={`icon-wrap ${color === "accent" ? "icon-wrap-accent" : ""} mb-3`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
