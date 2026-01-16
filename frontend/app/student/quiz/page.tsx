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
  Trophy,
  Clock,
  ArrowLeft,
  Award,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const answeredCount = Object.keys(answers).length
  const progressPercentage = (answeredCount / questions.length) * 100

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b shadow-sm backdrop-blur-sm bg-white/90 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/student/dashboard")}
              className="hover:bg-indigo-50 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-semibold text-gray-800">Quiz Time</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          
          {(submitted || alreadySubmitted) ? (
            <CardContent className="text-center py-16 px-8">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative w-28 h-28 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-500 hover:scale-110">
                  <CheckCircle className="w-16 h-16 text-white animate-bounce-slow" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {submitted ? "Quiz Submitted!" : "Already Submitted"}
                </h3>
                
                {submitted && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                    <div className="text-left">
                      <p className="text-sm text-gray-600">Your Score</p>
                      <p className="text-4xl font-bold text-gray-800">{score}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-gray-500 mt-6">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <p className="text-sm">Redirecting to dashboard...</p>
                </div>

                <div className="w-full max-w-md mx-auto h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full animate-progress"></div>
                </div>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Quiz Header */}
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        {currentQuestion + 1}
                      </div>
                      Question {currentQuestion + 1} of {questions.length}
                    </CardTitle>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {questions.map((q, index) => (
                      <div
                        key={index}
                        className={`transition-all duration-300 rounded-full ${
                          index === currentQuestion
                            ? "w-8 h-3 bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"
                            : answers[q.id]
                            ? "w-3 h-3 bg-green-500 shadow-sm hover:scale-125 cursor-pointer"
                            : "w-3 h-3 bg-gray-300 hover:scale-125 cursor-pointer"
                        }`}
                        onClick={() => setCurrentQuestion(index)}
                      />
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span className="font-medium">Progress</span>
                      <span className="font-bold">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Question Content */}
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Question Text */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 leading-relaxed">
                      {question.question_text}
                    </h3>
                  </div>

                  {/* Options */}
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: value,
                      }))
                    }
                    className="space-y-4"
                  >
                    {question.options.map((option, index) => (
                      <Label
                        key={option.key}
                        className={`group flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                          answers[question.id] === option.key
                            ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md scale-[1.02]"
                            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                        }`}
                      >
                        <RadioGroupItem
                          value={option.key}
                          className="sr-only"
                        />
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          answers[question.id] === option.key
                            ? "bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-indigo-600 shadow-lg"
                            : "border-gray-300 text-gray-600 group-hover:border-indigo-400 group-hover:text-indigo-600"
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className={`flex-1 text-base leading-relaxed transition-colors duration-300 ${
                          answers[question.id] === option.key
                            ? "text-gray-900 font-medium"
                            : "text-gray-700 group-hover:text-gray-900"
                        }`}>
                          {option.value}
                        </span>
                        {answers[question.id] === option.key && (
                          <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 animate-scale-in" />
                        )}
                      </Label>
                    ))}
                  </RadioGroup>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={currentQuestion === 0}
                      onClick={() => setCurrentQuestion((q) => q - 1)}
                      className="h-12 px-6 border-2 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 group"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                      Previous
                    </Button>

                    {currentQuestion === questions.length - 1 ? (
                      <Button 
                        onClick={handleSubmit}
                        size="lg"
                        className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.05] hover:shadow-xl group font-semibold relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          Submit Quiz
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setCurrentQuestion((q) => q + 1)}
                        size="lg"
                        className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.05] hover:shadow-xl group font-semibold relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Next Question
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 3s ease-in-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </main>
  )
}