"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
} from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

type QuizQuestion = {
  id: number
  question_text: string
  options: { key: string; value: string }[]
}

export default function StudentQuizPage() {
  const router = useRouter()

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [score, setScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  // ---------------- LOAD QUIZ ----------------
  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }

    const loadQuiz = async () => {
      const res = await fetch(`${BACKEND_URL}/quizzes/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (!res.ok || data.length === 0) {
        router.push("/student/dashboard")
        return
      }

      setQuestions(
        data.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          options: [
            { key: "A", value: q.option_a },
            { key: "B", value: q.option_b },
            { key: "C", value: q.option_c },
            { key: "D", value: q.option_d },
          ],
        }))
      )

      setLoading(false)
    }

    loadQuiz()
  }, [router, token])

  // ---------------- SUBMIT QUIZ ----------------
  const handleSubmit = async () => {
    if (!token) return

    const res = await fetch(`${BACKEND_URL}/quizzes/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (
        typeof data.detail === "string" &&
        data.detail.toLowerCase().includes("already")
      ) {
        setAlreadySubmitted(true)
        setTimeout(() => {
          router.push("/student/dashboard")
        }, 3000)
      }
      return
    }

    setScore(data.score)
    setSubmitted(true)

    setTimeout(() => {
      router.push("/student/dashboard")
    }, 3000)
  }

  if (loading) return null

  const question = questions[currentQuestion]

  return (
    <main className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Question {currentQuestion + 1} of {questions.length}
            </CardTitle>
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentQuestion
                      ? "bg-primary"
                      : answers[questions[index].id]
                      ? "bg-accent"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {(submitted || alreadySubmitted) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {submitted
                  ? "Quiz submitted successfully"
                  : "You have already submitted this quiz"}
              </h3>
              {submitted && (
                <p className="text-lg font-bold mb-2">
                  Your Score: {score}
                </p>
              )}
              <p className="text-muted-foreground">
                Redirecting to dashboard…
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-6">
                {question.question_text}
              </h3>

              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: value,
                  }))
                }
                className="space-y-3"
              >
                {question.options.map((option, index) => (
                  <Label
                    key={option.key}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${
                      answers[question.id] === option.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.key}
                      className="sr-only"
                    />
                    <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option.value}</span>
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion((q) => q - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button onClick={handleSubmit}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Quiz
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentQuestion((q) => q + 1)}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
