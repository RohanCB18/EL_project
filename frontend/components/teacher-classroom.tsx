"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Trophy, FileText, MessageSquare, Clock } from "lucide-react"

export default function TeacherClassroom() {
  const [classroomCode, setClassroomCode] = useState("")
  const [hasClassroom, setHasClassroom] = useState(false)

  const questions = [
    {
      id: 1,
      student: "Arjun Sharma",
      usn: "1RV21CS015",
      question: "Can you explain the time complexity of merge sort?",
      time: "5 min ago",
      status: "pending",
    },
    {
      id: 2,
      student: "Priya Reddy",
      usn: "1RV21CS032",
      question: "What is the difference between stack and queue?",
      time: "15 min ago",
      status: "pending",
    },
    {
      id: 3,
      student: "Karthik Kumar",
      usn: "1RV21CS048",
      question: "How does dynamic programming work?",
      time: "1 hour ago",
      status: "answered",
    },
  ]

  const handleCreateClassroom = () => {
    setClassroomCode("CS-DS-2024")
    setHasClassroom(true)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Classroom
          </h2>
          <p className="text-muted-foreground mt-1">Manage your classroom, create contests and quizzes</p>
        </div>
        {!hasClassroom && (
          <Button
            size="lg"
            className="shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
            onClick={handleCreateClassroom}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Classroom
          </Button>
        )}
      </div>

      {!hasClassroom ? (
        <Card className="border-2 border-dashed hover:border-primary/30 transition-all duration-300 max-w-2xl mx-auto">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Create Your First Classroom</h3>
                <p className="text-muted-foreground mt-2">
                  Start by creating a classroom to manage contests, quizzes, and student interactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left and middle columns - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Classroom Code */}
            <Card className="border-2 hover:border-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle>Classroom Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border-2 border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Share this code with your students</p>
                    <p className="text-3xl font-bold font-mono text-primary mt-1">{classroomCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="hover:bg-primary/10 hover:border-primary hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                  >
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 hover:border-accent/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-accent transition-colors">Create Contest</h3>
                      <p className="text-sm text-muted-foreground mt-1">Set up a coding or algorithm challenge</p>
                    </div>
                    <Button className="w-full hover:scale-105 active:scale-95 transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      New Contest
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Create Quiz</h3>
                      <p className="text-sm text-muted-foreground mt-1">Design assessments for your students</p>
                    </div>
                    <Button className="w-full hover:scale-105 active:scale-95 transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      New Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right column - Student Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                Student Questions
              </h3>
              <Badge variant="outline" className="px-3 py-1">
                {questions.filter((q) => q.status === "pending").length} New
              </Badge>
            </div>

            <div className="space-y-3">
              {questions.map((q) => (
                <Card
                  key={q.id}
                  className={`border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                    q.status === "pending"
                      ? "border-warning/30 hover:border-warning/50"
                      : "border-success/20 hover:border-success/30"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{q.student}</p>
                          <p className="text-xs text-muted-foreground">{q.usn}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            q.status === "pending" ? "border-warning/30 text-warning" : "border-success/30 text-success"
                          }
                        >
                          {q.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{q.question}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {q.time}
                        </span>
                        {q.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-primary/10 hover:border-primary hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                          >
                            Answer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
