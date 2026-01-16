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

  // ---------------- CREATE TEMPLATE ----------------
  const saveTemplate = async () => {
    if (!validate()) {
      setErrorMessage("All fields must be filled.")
      return
    }

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

    router.refresh()
    setMode("list")
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
      {/* ---------- ERROR MODAL ---------- */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-[360px]">
            <CardHeader className="flex justify-between items-center">
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

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            {mode !== "list" && (
              <Button variant="outline" onClick={() => setMode("list")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <h1 className="text-2xl font-bold">Quiz Templates</h1>
          </div>

          {mode === "list" && (
            <Button onClick={() => setMode("create")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Quiz Template
            </Button>
          )}
        </div>

        {/* ---------- LIST ---------- */}
        {mode === "list" && (
          <div className="space-y-4">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <span
                    className="font-medium cursor-pointer"
                    onClick={() => openTemplate(t.id)}
                  >
                    {t.title}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteTemplate(t.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ---------- CREATE ---------- */}
        {mode === "create" && (
          <ScrollArea className="h-[70vh] pr-4 space-y-6">
            <Label>Quiz Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />

            {questions.map((q, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle>Question {i + 1}</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={questions.length === 1}
                    onClick={() => removeQuestion(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Question"
                    value={q.question_text}
                    onChange={(e) =>
                      updateQuestion(i, "question_text", e.target.value)
                    }
                  />
                  {(["a", "b", "c", "d"] as const).map((o) => (
                    <Input
                      key={o}
                      placeholder={`Option ${o.toUpperCase()}`}
                      value={(q as any)[`option_${o}`]}
                      onChange={(e) =>
                        updateQuestion(
                          i,
                          `option_${o}` as keyof Question,
                          e.target.value
                        )
                      }
                    />
                  ))}
                  <Select
                    onValueChange={(v) =>
                      updateQuestion(i, "correct_option", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map((o) => (
                        <SelectItem key={o} value={o}>
                          Option {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addQuestion} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>

            <Button onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-2" /> Save Template
            </Button>
          </ScrollArea>
        )}

        {/* ---------- VIEW ---------- */}
        {mode === "view" && selectedTemplate && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {selectedTemplate.title}
            </h2>

            {selectedTemplate.questions.map((q, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium">{q.question_text}</p>
                  <p>A) {q.option_a}</p>
                  <p>B) {q.option_b}</p>
                  <p>C) {q.option_c}</p>
                  <p>D) {q.option_d}</p>
                  <p className="text-sm font-semibold">
                    Correct Option: {q.correct_option}
                  </p>
                </CardContent>
              </Card>
            ))}

            {inClassroom ? (
              <Button onClick={activateTemplate}>
                <Play className="w-4 h-4 mr-2" />
                Activate Quiz
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                You must be in a classroom to activate a quiz.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  )
}
