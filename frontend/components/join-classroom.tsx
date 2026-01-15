"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, Trophy, FileText, MessageSquare, Send, Clock } from "lucide-react"

export default function JoinClassroom() {
  const [classroomCode, setClassroomCode] = useState("")
  const [isJoined, setIsJoined] = useState(false)
  const [question, setQuestion] = useState("")

  const contests = [
    { id: 1, title: "Coding Sprint Challenge", deadline: "3 days left", participants: 45, prize: "Certificate" },
    { id: 2, title: "Algorithm Master Contest", deadline: "1 week left", participants: 62, prize: "Internship" },
  ]

  const quizzes = [
    { id: 1, title: "Week 5 Assessment", questions: 20, duration: "30 min", status: "active" },
    { id: 2, title: "Mid-term Quiz", questions: 35, duration: "60 min", status: "active" },
  ]

  const recentQuestions = [
    { id: 1, student: "Rahul K", question: "Can you explain the time complexity of merge sort?", time: "5 min ago" },
    { id: 2, student: "Priya S", question: "What is the difference between stack and queue?", time: "15 min ago" },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Join Classroom
          </h2>
          <p className="text-muted-foreground mt-1">Enter your classroom code to access courses and assessments</p>
        </div>
      </div>

      {!isJoined ? (
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Enter Classroom Code</CardTitle>
            <CardDescription>Ask your teacher for the classroom code to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Classroom Code</Label>
              <Input
                id="code"
                placeholder="e.g., CS101-2024"
                value={classroomCode}
                onChange={(e) => setClassroomCode(e.target.value)}
                className="text-lg font-mono transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
              />
            </div>
            <Button
              size="lg"
              className="w-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              onClick={() => setIsJoined(true)}
              disabled={!classroomCode}
            >
              <Plus className="w-5 h-5 mr-2" />
              Join Classroom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Contests and Quizzes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Contests */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Active Contests
              </h3>
              <div className="grid gap-4">
                {contests.map((contest) => (
                  <Card
                    key={contest.id}
                    className="border-2 hover:border-accent/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="group-hover:text-accent transition-colors">{contest.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {contest.deadline}
                            </span>
                            <span>{contest.participants} participants</span>
                          </CardDescription>
                        </div>
                        <Badge className="bg-accent/10 text-accent border-accent/20">{contest.prize}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full hover:scale-105 active:scale-95 transition-all duration-300">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Contest
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Active Quizzes */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Active Quizzes
              </h3>
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="border-2 hover:border-primary/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {quiz.questions} questions • {quiz.duration}
                          </p>
                        </div>
                        <Button className="hover:scale-110 active:scale-95 transition-all duration-300">
                          Start Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Ask Questions */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary" />
              Ask Your Teacher
            </h3>

            <Card className="border-2 hover:border-secondary/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base">Post a Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-32 transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
                />
                <Button
                  className="w-full hover:scale-105 active:scale-95 transition-all duration-300"
                  disabled={!question}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Question
                </Button>
              </CardContent>
            </Card>

            {/* Recent Questions */}
            <Card className="border-2 hover:border-muted transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base">Recent Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <p className="text-sm font-medium">{q.student}</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-2">{q.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
