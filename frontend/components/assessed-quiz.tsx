"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Eye, Edit, Trash2, Clock } from "lucide-react"

export default function AssessedQuiz() {
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: "Data Structures Final",
      subject: "Computer Science",
      questions: 25,
      duration: "60 min",
      created: "2 days ago",
      assigned: false,
    },
    {
      id: 2,
      title: "Algorithm Analysis",
      subject: "Computer Science",
      questions: 20,
      duration: "45 min",
      created: "5 days ago",
      assigned: true,
    },
    {
      id: 3,
      title: "Database Fundamentals",
      subject: "Information Systems",
      questions: 15,
      duration: "30 min",
      created: "1 week ago",
      assigned: false,
    },
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Assessed Quiz
          </h2>
          <p className="text-muted-foreground mt-1">Create and manage quizzes for your students</p>
        </div>
        <Button
          size="lg"
          className="shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Quiz
        </Button>
      </div>

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            className="border-2 hover:border-primary/30 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                    {quiz.assigned ? (
                      <Badge className="bg-success/10 text-success border-success/20">Assigned</Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/30">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{quiz.subject}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {quiz.duration}
                    </span>
                    <span>{quiz.questions} questions</span>
                    <span>Created {quiz.created}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 hover:bg-primary/10 hover:border-primary hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 hover:bg-secondary/10 hover:border-secondary hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {!quiz.assigned && (
                  <Button className="flex-1 hover:scale-105 active:scale-95 transition-all duration-300">
                    Assign to Students
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
