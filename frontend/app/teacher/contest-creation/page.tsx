"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, Save, ArrowLeft, X } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

interface TestCase {
  id: number
  input: string
  output: string
}

export default function TeacherContestCreationPage() {
  const router = useRouter()

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  // ---------- SAMPLE TEST CASES ----------
  const addSampleTestCase = () => {
    setSampleTestCases([
      ...sampleTestCases,
      { id: sampleTestCases.length + 1, input: "", output: "" },
    ])
  }

  const removeSampleTestCase = (id: number) => {
    if (sampleTestCases.length > 1) {
      setSampleTestCases(sampleTestCases.filter((tc) => tc.id !== id))
    }
  }

  const updateSampleTestCase = (
    id: number,
    field: "input" | "output",
    value: string
  ) => {
    setSampleTestCases(
      sampleTestCases.map((tc) =>
        tc.id === id ? { ...tc, [field]: value } : tc
      )
    )
  }

  // ---------- HIDDEN TEST CASES ----------
  const addHiddenTestCase = () => {
    setHiddenTestCases([
      ...hiddenTestCases,
      { id: hiddenTestCases.length + 1, input: "", output: "" },
    ])
  }

  const removeHiddenTestCase = (id: number) => {
    if (hiddenTestCases.length > 1) {
      setHiddenTestCases(hiddenTestCases.filter((tc) => tc.id !== id))
    }
  }

  const updateHiddenTestCase = (
    id: number,
    field: "input" | "output",
    value: string
  ) => {
    setHiddenTestCases(
      hiddenTestCases.map((tc) =>
        tc.id === id ? { ...tc, [field]: value } : tc
      )
    )
  }

  // ---------- SAVE CONTEST ----------
  const handleSave = async () => {
    if (!token) return

    try {
      const test_cases = [
        ...sampleTestCases.map((tc) => ({
          input_data: tc.input,
          expected_output: tc.output,
          is_sample: true,
        })),
        ...hiddenTestCases.map((tc) => ({
          input_data: tc.input,
          expected_output: tc.output,
          is_sample: false,
        })),
      ]

      const payload = {
        title,
        description,
        input_format: inputFormat,
        output_format: outputFormat,
        constraints,
        time_limit_ms: 1000,
        memory_limit_kb: 65536,
        test_cases,
      }

      const res = await fetch(`${BACKEND_URL}/contests/create`, {
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
      {/* ---------- ERROR POPUP ---------- */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-[360px]">
            <CardHeader className="flex flex-row items-center justify-between">
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
                Create Contest
              </h1>
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Contest
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-6 pr-4">

              {/* ---------- PROBLEM DETAILS ---------- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Problem Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Input Format</Label>
                    <Textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Constraints</Label>
                    <Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* ---------- SAMPLE TEST CASES ---------- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sample Test Cases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sampleTestCases.map((tc, i) => (
                    <div key={tc.id} className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="flex justify-between">
                        <span>Sample {i + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSampleTestCase(tc.id)}
                          disabled={sampleTestCases.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Input"
                        value={tc.input}
                        onChange={(e) => updateSampleTestCase(tc.id, "input", e.target.value)}
                      />

                      <Textarea
                        placeholder="Output"
                        value={tc.output}
                        onChange={(e) => updateSampleTestCase(tc.id, "output", e.target.value)}
                      />
                    </div>
                  ))}

                  <Button variant="outline" onClick={addSampleTestCase}>
                    <Plus className="w-4 h-4 mr-2" /> Add Sample Test Case
                  </Button>
                </CardContent>
              </Card>

              {/* ---------- HIDDEN TEST CASES ---------- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hidden Test Cases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hiddenTestCases.map((tc, i) => (
                    <div key={tc.id} className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="flex justify-between">
                        <span>Hidden {i + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHiddenTestCase(tc.id)}
                          disabled={hiddenTestCases.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Input"
                        value={tc.input}
                        onChange={(e) => updateHiddenTestCase(tc.id, "input", e.target.value)}
                      />

                      <Textarea
                        placeholder="Output"
                        value={tc.output}
                        onChange={(e) => updateHiddenTestCase(tc.id, "output", e.target.value)}
                      />
                    </div>
                  ))}

                  <Button variant="outline" onClick={addHiddenTestCase}>
                    <Plus className="w-4 h-4 mr-2" /> Add Hidden Test Case
                  </Button>
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        </div>
      </main>
    </>
  )
}
