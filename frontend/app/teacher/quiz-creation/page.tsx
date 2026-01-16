"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Save, ArrowLeft, X } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

interface Question {
  id: number
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string
}

export default function TeacherQuizCreationPage() {
  const router = useRouter()

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "",
    },
  ])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "",
      },
    ])
  }

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  const updateQuestion = (
    id: number,
    field: keyof Question,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    )
  }

  // ---------------- SAVE QUIZ ----------------
  const handleSave = async () => {
    if (!token) return

    try {
      const payload = {
        questions: questions.map((q) => ({
          question_text: q.question,
          option_a: q.optionA,
          option_b: q.optionB,
          option_c: q.optionC,
          option_d: q.optionD,
          correct_option: q.correctOption,
        })),
      }

      const res = await fetch(`${BACKEND_URL}/quizzes/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)

      router.push("/teacher/dashboard")
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong")
    }
  }

  return (
    <>
      {/* ERROR POPUP */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-[360px]">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Error</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setErrorMessage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {errorMessage}
            </CardContent>
          </Card>
        </div>
      )}

      <main className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/teacher/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                Create Quiz
              </h1>
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Quiz
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-6 pr-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Question {index + 1}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(question.id)}
                        disabled={questions.length === 1}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${question.id}`}>
                        Question
                      </Label>
                      <Input
                        id={`question-${question.id}`}
                        placeholder="Enter your question"
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(
                            question.id,
                            "question",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`optionA-${question.id}`}>
                          Option A
                        </Label>
                        <Input
                          id={`optionA-${question.id}`}
                          placeholder="Enter option A"
                          value={question.optionA}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "optionA",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`optionB-${question.id}`}>
                          Option B
                        </Label>
                        <Input
                          id={`optionB-${question.id}`}
                          placeholder="Enter option B"
                          value={question.optionB}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "optionB",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`optionC-${question.id}`}>
                          Option C
                        </Label>
                        <Input
                          id={`optionC-${question.id}`}
                          placeholder="Enter option C"
                          value={question.optionC}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "optionC",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`optionD-${question.id}`}>
                          Option D
                        </Label>
                        <Input
                          id={`optionD-${question.id}`}
                          placeholder="Enter option D"
                          value={question.optionD}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "optionD",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`correct-${question.id}`}>
                        Correct Option
                      </Label>
                      <Select
                        value={question.correctOption}
                        onValueChange={(value) =>
                          updateQuestion(
                            question.id,
                            "correctOption",
                            value
                          )
                        }
                      >
                        <SelectTrigger id={`correct-${question.id}`}>
                          <SelectValue placeholder="Select correct option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Option A</SelectItem>
                          <SelectItem value="B">Option B</SelectItem>
                          <SelectItem value="C">Option C</SelectItem>
                          <SelectItem value="D">Option D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full h-14 border-dashed bg-transparent"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </Button>
            </div>
          </ScrollArea>
        </div>
      </main>
    </>
  )
}
