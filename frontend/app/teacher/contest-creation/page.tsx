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
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
  Play,
} from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

/* ---------------- TYPES ---------------- */

interface TestCase {
  id: number
  input: string
  output: string
}

interface ContestTemplateSummary {
  id: number
  title: string
}

interface ContestTemplateDetail {
  id: number
  title: string
  description: string
  input_format: string
  output_format: string
  constraints: string
  test_cases: {
    input_data: string
    expected_output: string
    is_sample: boolean
  }[]
}

/* ---------------- PAGE ---------------- */

export default function TeacherContestCreationPage() {
  const router = useRouter()

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  /* ---------------- MODE ---------------- */
  const [mode, setMode] = useState<"list" | "create" | "view">("list")

  /* ---------------- COMMON STATE ---------------- */
  const [templates, setTemplates] = useState<ContestTemplateSummary[]>([])
  const [selected, setSelected] = useState<ContestTemplateDetail | null>(null)
  const [inClassroom, setInClassroom] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  /* ---------------- CREATE FORM STATE ---------------- */

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [inputFormat, setInputFormat] = useState("")
  const [outputFormat, setOutputFormat] = useState("")
  const [constraints, setConstraints] = useState("")

  const [sampleTestCases, setSampleTestCases] = useState<TestCase[]>([
    { id: 1, input: "", output: "" },
  ])

  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([
    { id: 1, input: "", output: "" },
  ])

  /* ---------------- FETCH ---------------- */

  const fetchTemplates = async () => {
    const res = await fetch(`${BACKEND_URL}/contest-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setTemplates(data)
  }

  useEffect(() => {
    if (!token) return

    fetchTemplates()

    fetch(`${BACKEND_URL}/classrooms/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setInClassroom(true))
      .catch(() => setInClassroom(false))
  }, [token])

  /* ---------------- HELPERS ---------------- */

  const resetCreateForm = () => {
    setTitle("")
    setDescription("")
    setInputFormat("")
    setOutputFormat("")
    setConstraints("")
    setSampleTestCases([{ id: 1, input: "", output: "" }])
    setHiddenTestCases([{ id: 1, input: "", output: "" }])
  }

  /* ---------------- SAMPLE TEST CASES ---------------- */

  const addSampleTestCase = () => {
    setSampleTestCases([
      ...sampleTestCases,
      { id: sampleTestCases.length + 1, input: "", output: "" },
    ])
  }

  const removeSampleTestCase = (id: number) => {
    if (sampleTestCases.length > 1) {
      setSampleTestCases(sampleTestCases.filter(tc => tc.id !== id))
    }
  }

  const updateSampleTestCase = (
    id: number,
    field: "input" | "output",
    value: string
  ) => {
    setSampleTestCases(
      sampleTestCases.map(tc =>
        tc.id === id ? { ...tc, [field]: value } : tc
      )
    )
  }

  /* ---------------- HIDDEN TEST CASES ---------------- */

  const addHiddenTestCase = () => {
    setHiddenTestCases([
      ...hiddenTestCases,
      { id: hiddenTestCases.length + 1, input: "", output: "" },
    ])
  }

  const removeHiddenTestCase = (id: number) => {
    if (hiddenTestCases.length > 1) {
      setHiddenTestCases(hiddenTestCases.filter(tc => tc.id !== id))
    }
  }

  const updateHiddenTestCase = (
    id: number,
    field: "input" | "output",
    value: string
  ) => {
    setHiddenTestCases(
      hiddenTestCases.map(tc =>
        tc.id === id ? { ...tc, [field]: value } : tc
      )
    )
  }

  /* ---------------- VALIDATION ---------------- */

  const validate = () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !inputFormat.trim() ||
      !outputFormat.trim() ||
      !constraints.trim()
    ) {
      return "All problem fields must be filled."
    }

    for (const tc of sampleTestCases) {
      if (!tc.input.trim() || !tc.output.trim()) {
        return "All sample test cases must be filled."
      }
    }

    for (const tc of hiddenTestCases) {
      if (!tc.input.trim() || !tc.output.trim()) {
        return "All hidden test cases must be filled."
      }
    }

    return null
  }

  /* ---------------- CREATE TEMPLATE ---------------- */

  const handleSaveTemplate = async () => {
    if (isSaving) return

    const validationError = validate()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        title,
        description,
        input_format: inputFormat,
        output_format: outputFormat,
        constraints,
        time_limit_ms: 1000,
        memory_limit_kb: 65536,
        test_cases: [
          ...sampleTestCases.map(tc => ({
            input_data: tc.input,
            expected_output: tc.output,
            is_sample: true,
          })),
          ...hiddenTestCases.map(tc => ({
            input_data: tc.input,
            expected_output: tc.output,
            is_sample: false,
          })),
        ],
      }

      const res = await fetch(
        `${BACKEND_URL}/contest-templates/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)

      resetCreateForm()
      setMode("list")
      fetchTemplates()

    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  /* ---------------- VIEW ---------------- */

  const openTemplate = async (id: number) => {
    const res = await fetch(
      `${BACKEND_URL}/contest-templates/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    setSelected(data)
    setMode("view")
  }

  /* ---------------- DELETE ---------------- */

  const deleteTemplate = async (id: number) => {
    await fetch(
      `${BACKEND_URL}/contest-templates/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    fetchTemplates()
  }

  /* ---------------- ACTIVATE ---------------- */

  const activateTemplate = async () => {
    if (!selected) return

    const res = await fetch(
      `${BACKEND_URL}/contest-templates/${selected.id}/activate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) {
      const d = await res.json()
      setErrorMessage(d.detail || "Activation failed")
      return
    }

    router.push("/teacher/dashboard")
  }

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* ERROR MODAL */}
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
            <CardContent>{errorMessage}</CardContent>
          </Card>
        </div>
      )}

      <main className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Contest Templates</h1>
            <div className="flex gap-2">
              {mode === "list" && (
                <Button onClick={() => { resetCreateForm(); setMode("create") }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push("/teacher/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>

          {/* LIST */}
          {mode === "list" && (
            <div className="space-y-4">
              {templates.map(t => (
                <Card key={t.id}>
                  <CardContent className="flex justify-between items-center p-4">
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

          {/* VIEW */}
          {mode === "view" && selected && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selected.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{selected.description}</p>
                  <p><b>Input:</b> {selected.input_format}</p>
                  <p><b>Output:</b> {selected.output_format}</p>
                  <p><b>Constraints:</b> {selected.constraints}</p>
                </CardContent>
              </Card>

              {inClassroom ? (
                <Button onClick={activateTemplate}>
                  <Play className="w-4 h-4 mr-2" />
                  Activate Contest
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  You must be in a classroom to activate a contest.
                </p>
              )}
            </div>
          )}

          {/* CREATE */}
          {mode === "create" && (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">

                {/* PROBLEM DETAILS */}
                <Card>
                  <CardHeader>
                    <CardTitle>Problem Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                    <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                    <Textarea placeholder="Input Format" value={inputFormat} onChange={e => setInputFormat(e.target.value)} />
                    <Textarea placeholder="Output Format" value={outputFormat} onChange={e => setOutputFormat(e.target.value)} />
                    <Textarea placeholder="Constraints" value={constraints} onChange={e => setConstraints(e.target.value)} />
                  </CardContent>
                </Card>

                {/* SAMPLE TESTS */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Test Cases</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sampleTestCases.map((tc, i) => (
                      <div key={tc.id} className="p-4 bg-muted/50 rounded space-y-2">
                        <div className="flex justify-between">
                          <span>Sample {i + 1}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSampleTestCase(tc.id)}
                            disabled={sampleTestCases.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea placeholder="Input" value={tc.input} onChange={e => updateSampleTestCase(tc.id, "input", e.target.value)} />
                        <Textarea placeholder="Output" value={tc.output} onChange={e => updateSampleTestCase(tc.id, "output", e.target.value)} />
                      </div>
                    ))}
                    <Button variant="outline" onClick={addSampleTestCase}>
                      <Plus className="w-4 h-4 mr-2" /> Add Sample Test
                    </Button>
                  </CardContent>
                </Card>

                {/* HIDDEN TESTS */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hidden Test Cases</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hiddenTestCases.map((tc, i) => (
                      <div key={tc.id} className="p-4 bg-muted/50 rounded space-y-2">
                        <div className="flex justify-between">
                          <span>Hidden {i + 1}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeHiddenTestCase(tc.id)}
                            disabled={hiddenTestCases.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea placeholder="Input" value={tc.input} onChange={e => updateHiddenTestCase(tc.id, "input", e.target.value)} />
                        <Textarea placeholder="Output" value={tc.output} onChange={e => updateHiddenTestCase(tc.id, "output", e.target.value)} />
                      </div>
                    ))}
                    <Button variant="outline" onClick={addHiddenTestCase}>
                      <Plus className="w-4 h-4 mr-2" /> Add Hidden Test
                    </Button>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveTemplate} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Template"}
                </Button>

              </div>
            </ScrollArea>
          )}

        </div>
      </main>
    </>
  )
}
