"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle2, PlayCircle, Trophy } from "lucide-react"

export default function AssessmentQuizzes() {
  const quizzes = [
    {
      id: 1,
      title: "Data Structures Final",
      subject: "Computer Science",
      duration: "60 min",
      questions: 25,
      status: "pending",
      dueDate: "2 days left",
      difficulty: "Hard",
    },
    {
      id: 2,
      title: "Algorithm Analysis",
      subject: "Computer Science",
      duration: "45 min",
      questions: 20,
      status: "pending",
      dueDate: "5 days left",
      difficulty: "Medium",
    },
    {
      id: 3,
      title: "Database Management",
      subject: "Information Systems",
      duration: "30 min",
      questions: 15,
      status: "completed",
      score: 85,
      difficulty: "Easy",
    },
    {
      id: 4,
      title: "Operating Systems",
      subject: "Computer Science",
      duration: "50 min",
      questions: 22,
      status: "pending",
      dueDate: "1 week left",
      difficulty: "Hard",
    },
    {
      id: 5,
      title: "Web Technologies",
      subject: "Internet Programming",
      duration: "40 min",
      questions: 18,
      status: "completed",
      score: 92,
      difficulty: "Medium",
    },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Assessment Quizzes
          </h2>
          <p className="text-muted-foreground mt-1">Complete your pending quizzes and track your performance</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-4 py-2 text-base hover:bg-accent/10 transition-colors">
            <span className="w-2 h-2 rounded-full bg-warning mr-2" />
            {quizzes.filter((q) => q.status === "pending").length} Pending
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-base hover:bg-success/10 transition-colors">
            <span className="w-2 h-2 rounded-full bg-success mr-2" />
            {quizzes.filter((q) => q.status === "completed").length} Completed
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            className={`border-2 transition-all duration-300 cursor-pointer group ${
              quiz.status === "pending"
                ? "hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]"
                : "hover:border-success/30 hover:shadow-lg hover:scale-[1.01]"
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`${
                        quiz.difficulty === "Hard"
                          ? "border-destructive/50 text-destructive"
                          : quiz.difficulty === "Medium"
                            ? "border-warning/50 text-warning"
                            : "border-success/50 text-success"
                      }`}
                    >
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 text-base">
                    <span>{quiz.subject}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {quiz.duration}
                    </span>
                    <span>{quiz.questions} questions</span>
                  </CardDescription>
                </div>

                {quiz.status === "pending" ? (
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
                      {quiz.dueDate}
                    </Badge>
                    <Button
                      size="lg"
                      className="shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Start Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Completed
                    </Badge>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-bold text-xl">
                      <Trophy className="w-5 h-5" />
                      {quiz.score}%
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            {quiz.status === "pending" && (
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 group-hover:animate-pulse"
                      style={{ width: "0%" }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">Not started</span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
