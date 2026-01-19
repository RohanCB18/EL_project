import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Proctoring System",
  description:
    "Secure online quiz proctoring platform - Select your role to continue",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="glass max-w-md w-full shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">
            Quiz Proctoring System
          </CardTitle>
          <p className="text-muted-foreground font-medium mt-2">
            Select your role to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Link href="/auth/student" className="block">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold gap-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <GraduationCap className="w-5 h-5" />I am a Student
            </Button>
          </Link>
          <Link href="/auth/teacher" className="block">
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-14 text-lg font-semibold gap-3 border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <BookOpen className="w-5 h-5" />I am a Teacher
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
