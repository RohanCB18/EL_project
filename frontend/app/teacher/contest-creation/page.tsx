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
  Code2,
  FileText,
  TestTube2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">

          {/* HEADER */}
          <div className="flex justify-between items-center animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <Code2 className="w-9 h-9 text-indigo-600" />
                Contest Templates
              </h1>
              <p className="text-gray-600 ml-12">Create and manage coding challenges for your students</p>
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
                  New Template
                </Button>
              )}
            </div>
          </div>

          {/* LIST */}
          {mode === "list" && (
            <div className="space-y-4 animate-fade-in">
              {templates.length === 0 ? (
                <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
                  <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <Code2 className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-gray-800">No Templates Yet</h3>
                      <p className="text-gray-600">Create your first contest template to get started!</p>
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
                          <FileText className="w-6 h-6 text-indigo-600" />
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

          {/* VIEW */}
          {mode === "view" && selected && (
            <div className="space-y-6 animate-fade-in">
              <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Code2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-bold text-gray-800 mb-2">{selected.title}</CardTitle>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Contest Template Details
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-indigo-500">
                      <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{selected.description}</p>
                    </div>
                    
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Input Format
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{selected.input_format}</p>
                    </div>
                    
                    <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-500">
                      <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Output Format
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{selected.output_format}</p>
                    </div>
                    
                    <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-l-4 border-orange-500">
                      <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Constraints
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{selected.constraints}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-gray-100">
                    {inClassroom ? (
                      <Button
                        onClick={activateTemplate}
                        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] group"
                      >
                        <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        Activate Contest in Classroom
                      </Button>
                    ) : (
                      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-l-4 border-amber-500">
                        <p className="text-amber-900 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          You must create a classroom first to activate contests
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CREATE */}
          {mode === "create" && (
            <ScrollArea className="h-[calc(100vh-200px)] pr-4 animate-fade-in">
              <div className="space-y-6 pb-8">

                {/* PROBLEM DETAILS */}
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Problem Details</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Define your coding challenge</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 p-8">
                    <div className="space-y-2 group">
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Problem Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Two Sum Problem"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 group-hover:border-indigo-300"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the problem in detail..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="min-h-[120px] border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none group-hover:border-indigo-300"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="inputFormat" className="text-sm font-semibold text-gray-700">Input Format</Label>
                      <Textarea
                        id="inputFormat"
                        placeholder="Specify how input will be provided..."
                        value={inputFormat}
                        onChange={e => setInputFormat(e.target.value)}
                        className="min-h-[100px] border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none group-hover:border-indigo-300"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="outputFormat" className="text-sm font-semibold text-gray-700">Output Format</Label>
                      <Textarea
                        id="outputFormat"
                        placeholder="Specify the expected output format..."
                        value={outputFormat}
                        onChange={e => setOutputFormat(e.target.value)}
                        className="min-h-[100px] border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none group-hover:border-indigo-300"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <Label htmlFor="constraints" className="text-sm font-semibold text-gray-700">Constraints</Label>
                      <Textarea
                        id="constraints"
                        placeholder="List any constraints or limitations..."
                        value={constraints}
                        onChange={e => setConstraints(e.target.value)}
                        className="min-h-[100px] border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none group-hover:border-indigo-300"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* SAMPLE TESTS */}
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Sample Test Cases</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Visible examples for students</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 p-8">
                    {sampleTestCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 space-y-4 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-900 flex items-center gap-2">
                            <TestTube2 className="w-5 h-5" />
                            Sample Test Case {i + 1}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSampleTestCase(tc.id)}
                            disabled={sampleTestCases.length === 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-30 group/delete"
                          >
                            <Trash2 className="w-5 h-5 group-hover/delete:scale-110 transition-transform duration-300" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Input</Label>
                            <Textarea
                              placeholder="Enter sample input..."
                              value={tc.input}
                              onChange={e => updateSampleTestCase(tc.id, "input", e.target.value)}
                              className="min-h-[80px] border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 resize-none bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Expected Output</Label>
                            <Textarea
                              placeholder="Enter expected output..."
                              value={tc.output}
                              onChange={e => updateSampleTestCase(tc.id, "output", e.target.value)}
                              className="min-h-[80px] border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 resize-none bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addSampleTestCase}
                      className="w-full h-12 border-2 border-green-300 hover:bg-green-50 hover:border-green-400 transition-all duration-300 rounded-xl group"
                    >
                      <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Add Sample Test Case
                    </Button>
                  </CardContent>
                </Card>

                {/* HIDDEN TESTS */}
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <EyeOff className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Hidden Test Cases</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Private test cases for evaluation</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 p-8">
                    {hiddenTestCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 space-y-4 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-purple-900 flex items-center gap-2">
                            <TestTube2 className="w-5 h-5" />
                            Hidden Test Case {i + 1}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeHiddenTestCase(tc.id)}
                            disabled={hiddenTestCases.length === 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-30 group/delete"
                          >
                            <Trash2 className="w-5 h-5 group-hover/delete:scale-110 transition-transform duration-300" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Input</Label>
                            <Textarea
                              placeholder="Enter hidden input..."
                              value={tc.input}
                              onChange={e => updateHiddenTestCase(tc.id, "input", e.target.value)}
                              className="min-h-[80px] border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 resize-none bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Expected Output</Label>
                            <Textarea
                              placeholder="Enter expected output..."
                              value={tc.output}
                              onChange={e => updateHiddenTestCase(tc.id, "output", e.target.value)}
                              className="min-h-[80px] border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 resize-none bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addHiddenTestCase}
                      className="w-full h-12 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 rounded-xl group"
                    >
                      <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Add Hidden Test Case
                    </Button>
                  </CardContent>
                </Card>

                {/* SAVE BUTTON */}
                <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 overflow-hidden sticky bottom-0">
                  <CardContent className="p-6">
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={isSaving}
                      className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSaving ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Saving Template...
                          </>
                        ) : (
                          <>
                            <Save className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                            Save Contest Template
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