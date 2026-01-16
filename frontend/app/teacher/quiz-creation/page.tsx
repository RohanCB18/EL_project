"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  ArrowLeft,
  Save,
  X,
  Play,
  Trash2,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ClipboardList,
} from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

interface QuizTemplate {
  id: number
  title: string
}

interface Question {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

export default function TeacherQuizCreationPage() {
  const router = useRouter()
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const [mode, setMode] = useState<"list" | "create" | "view">("list")
  const [templates, setTemplates] = useState<QuizTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: number
    title: string
    questions: Question[]
  } | null>(null)

  const [inClassroom, setInClassroom] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ---------------- CREATE STATE ----------------
  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "",
    },
  ])

  // ---------------- FETCH INITIAL ----------------
  useEffect(() => {
    if (!token) return

    fetch(`${BACKEND_URL}/quiz-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTemplates)

    fetch(`${BACKEND_URL}/classrooms/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setInClassroom(true))
      .catch(() => setInClassroom(false))
  }, [token])

  // ---------------- HELPERS ----------------
  const addQuestion = () =>
    setQuestions([
      ...questions,
      {
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "",
      },
    ])

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const updateQuestion = (
    idx: number,
    field: keyof Question,
    value: string
  ) => {
    const copy = [...questions]
    copy[idx][field] = value
    setQuestions(copy)
  }

  const validate = () => {
    if (!title.trim()) return false
    return questions.every(
      (q) =>
        q.question_text.trim() &&
        q.option_a.trim() &&
        q.option_b.trim() &&
        q.option_c.trim() &&
        q.option_d.trim() &&
        q.correct_option
    )
  }

  const resetCreateForm = () => {
    setTitle("")
    setQuestions([
      {
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "",
      },
    ])
  }

  // ---------------- CREATE TEMPLATE ----------------
  const saveTemplate = async () => {
    if (isSaving) return

    if (!validate()) {
      setErrorMessage("All fields must be filled.")
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch(`${BACKEND_URL}/quiz-templates/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, questions }),
      })

      if (!res.ok) {
        const d = await res.json()
        setErrorMessage(d.detail || "Failed to create template")
        return
      }

      // Refresh templates list
      const templatesRes = await fetch(`${BACKEND_URL}/quiz-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const templatesData = await templatesRes.json()
      setTemplates(templatesData)

      resetCreateForm()
      setMode("list")
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------- VIEW TEMPLATE ----------------
  const openTemplate = async (id: number) => {
    const res = await fetch(`${BACKEND_URL}/quiz-templates/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setSelectedTemplate(data)
    setMode("view")
  }

  // ---------------- DELETE TEMPLATE ----------------
  const deleteTemplate = async (id: number) => {
    await fetch(`${BACKEND_URL}/quiz-templates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    setTemplates(templates.filter((t) => t.id !== id))
  }

  // ---------------- ACTIVATE ----------------
  const activateTemplate = async () => {
    if (!selectedTemplate) return

    const res = await fetch(
      `${BACKEND_URL}/quiz-templates/${selectedTemplate.id}/activate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) {
      const d = await res.json()
      setErrorMessage(d.detail)
      return
    }

    router.push("/teacher/dashboard")
  }

  return (
    <>
      {errorMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-[420px] shadow-2xl border-2 border-red-200 animate-scale-in">
            <CardHeader className="flex flex-row justify-between items-start pb-4 bg-gradient-to-r from-red-50 to-pink-50 border-b-2 border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <CardTitle className="text-xl text-red-900">Error</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setErrorMessage(null)}
                className="hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5 text-red-600" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <p className="text-gray-700 leading-relaxed">{errorMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
          <div className="flex justify-between items-center animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <FileQuestion className="w-9 h-9 text-indigo-600" />
                Quiz Templates
              </h1>
              <p className="text-gray-600 ml-12">Create and manage quizzes for your students</p>
            </div>
            <div className="flex gap-3">
              {mode !== "list" && (
                <Button
                  onClick={() => setMode("list")}
                  variant="outline"
                  className="h-12 px-6 border-2 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 rounded-xl group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                  Back to List
                </Button>
              )}
              {mode === "list" && (
                <Button
                  onClick={() => { resetCreateForm(); setMode("create") }}
                  className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] group"
                >
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  New Quiz Template
                </Button>
              )}
            </div>
          </div>

          {mode === "list" && (
            <div className="space-y-4 animate-fade-in">
              {templates.length === 0 ? (
                <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
                  <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <FileQuestion className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-gray-800">No Quiz Templates Yet</h3>
                      <p className="text-gray-600">Create your first quiz template to get started!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                templates.map((t, idx) => (
                  <Card
                    key={t.id}
                    className="shadow-lg border-0 backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01] group animate-slide-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <CardContent className="flex justify-between items-center p-6">
                      <div
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => openTemplate(t.id)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <ClipboardList className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="font-semibold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                          {t.title}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 w-11 h-11 group/delete"
                        onClick={() => deleteTemplate(t.id)}
                      >
                        <Trash2 className="w-5 h-5 group-hover/delete:scale-110 transition-transform duration-300" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {mode === "create" && (
            <ScrollArea className="h-[calc(100vh-200px)] pr-4 animate-fade-in">
              <div className="space-y-6 pb-8">
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <FileQuestion className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Quiz Information</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Set the title for your quiz</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-2 group">
                      <Label htmlFor="quiz-title" className="text-sm font-semibold text-gray-700">Quiz Title</Label>
                      <Input
                        id="quiz-title"
                        placeholder="e.g., Chapter 1 Assessment"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 group-hover:border-indigo-300"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {questions.map((q, i) => (
                    <Card
                      key={i}
                      className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden hover:shadow-3xl transition-all duration-300"
                    >
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100 pb-5">
                        <div className="flex flex-row justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                              {i + 1}
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-800">Question {i + 1}</CardTitle>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={questions.length === 1}
                            onClick={() => removeQuestion(i)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-30 group/delete"
                          >
                            <Trash2 className="w-5 h-5 group-hover/delete:scale-110 transition-transform duration-300" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-8">
                        <div className="space-y-2 group">
                          <Label className="text-sm font-semibold text-gray-700">Question Text</Label>
                          <Input
                            placeholder="Enter your question..."
                            value={q.question_text}
                            onChange={(e) =>
                              updateQuestion(i, "question_text", e.target.value)
                            }
                            className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 group-hover:border-blue-300"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(["a", "b", "c", "d"] as const).map((o) => (
                            <div key={o} className="space-y-2 group">
                              <Label className="text-sm font-semibold text-gray-700">
                                Option {o.toUpperCase()}
                              </Label>
                              <Input
                                placeholder={`Enter option ${o.toUpperCase()}...`}
                                value={(q as any)[`option_${o}`]}
                                onChange={(e) =>
                                  updateQuestion(
                                    i,
                                    `option_${o}` as keyof Question,
                                    e.target.value
                                  )
                                }
                                className="h-11 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 group-hover:border-blue-300"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2 group pt-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Correct Answer
                          </Label>
                          <Select
                            value={q.correct_option}
                            onValueChange={(v) =>
                              updateQuestion(i, "correct_option", v)
                            }
                          >
                            <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 group-hover:border-green-300">
                              <SelectValue placeholder="Select the correct option" />
                            </SelectTrigger>
                            <SelectContent>
                              {["A", "B", "C", "D"].map((o) => (
                                <SelectItem key={o} value={o} className="cursor-pointer">
                                  Option {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full h-14 border-2 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 rounded-xl group text-base font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Add Another Question
                </Button>

                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden sticky bottom-0">
                  <CardContent className="p-6">
                    <Button
                      onClick={saveTemplate}
                      disabled={isSaving}
                      className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSaving ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Saving Quiz Template...
                          </>
                        ) : (
                          <>
                            <Save className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                            Save Quiz Template
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}

          {mode === "view" && selectedTemplate && (
            <div className="space-y-6 animate-fade-in">
              <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <FileQuestion className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
                        {selectedTemplate.title}
                      </CardTitle>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        {selectedTemplate.questions.length} Question{selectedTemplate.questions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div className="space-y-5">
                {selectedTemplate.questions.map((q, i) => (
                  <Card
                    key={i}
                    className="shadow-lg border-0 backdrop-blur-sm bg-white/90 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {i + 1}
                        </div>
                        <p className="font-semibold text-lg text-gray-800 leading-relaxed flex-1">
                          {q.question_text}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                        {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                          const isCorrect = q.correct_option === opt.toUpperCase()
                          return (
                            <div
                              key={opt}
                              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                                isCorrect
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-gray-600'}`}>
                                  {opt.toUpperCase()})
                                </span>
                                <span className={`${isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                                  {(q as any)[`option_${opt}`]}
                                </span>
                                {isCorrect && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
                <CardContent className="p-6">
                  {inClassroom ? (
                    <Button
                      onClick={activateTemplate}
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] group"
                    >
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Activate Quiz in Classroom
                    </Button>
                  ) : (
                    <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-l-4 border-amber-500">
                      <p className="text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        You must create a classroom first to activate quizzes
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
        }
      `}</style>
    </>
  )
}