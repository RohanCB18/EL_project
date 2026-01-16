"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Send, ArrowLeft, CheckCircle, XCircle } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

const LANGUAGE_MAP: Record<string, number> = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
}

export default function StudentContestPage() {
  const router = useRouter()

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const [question, setQuestion] = useState<any>(null)
  const [samples, setSamples] = useState<any[]>([])
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("cpp")

  const [judgeResult, setJudgeResult] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // ---------------- LOAD CONTEST ----------------
  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }

    const load = async () => {
      const q = await fetch(`${BACKEND_URL}/contests/question`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!q.ok) {
        router.push("/student/dashboard")
        return
      }

      setQuestion(await q.json())

      const s = await fetch(`${BACKEND_URL}/contests/sample-tests`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (s.ok) {
        const data = await s.json()
        setSamples(data)
      }
    }

    load()
  }, [router, token])

  // ---------------- RUN ----------------
  const runCode = async () => {
    if (!token) return
    setLoading(true)
    setJudgeResult(null)

    const res = await fetch(`${BACKEND_URL}/contests/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: LANGUAGE_MAP[language],
        input_data: samples.map((s) => s.input_data).join("\n"),
      }),
    })

    const data = await res.json()
    setJudgeResult(data)
    setLoading(false)
  }

  // ---------------- SUBMIT ----------------
  const submitCode = async () => {
    if (!token) return
    setLoading(true)

    const res = await fetch(`${BACKEND_URL}/contests/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: LANGUAGE_MAP[language],
      }),
    })

    const data = await res.json()
    setScore(data.score)
    setSubmitted(true)
    setLoading(false)

    setTimeout(() => {
      router.push("/student/dashboard")
    }, 3000)
  }

  if (!question) return null

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)]">

        {submitted ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="text-2xl font-semibold">Submission Successful</h3>
              <p className="text-lg font-bold mt-2">Score: {score}</p>
              <p className="text-muted-foreground mt-2">
                Redirecting to dashboard…
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">

            {/* LEFT */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{question.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{question.description}</p>
                  <p><b>Input:</b> {question.input_format}</p>
                  <p><b>Output:</b> {question.output_format}</p>
                  <p><b>Constraints:</b> {question.constraints}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Test Cases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {samples.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold mb-1">Input</p>
                        <Textarea readOnly value={s.input_data} className="font-mono bg-muted" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Output</p>
                        <Textarea readOnly value={s.expected_output} className="font-mono bg-muted" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle>Code Editor</CardTitle>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-full font-mono bg-[#1e1e1e] text-[#d4d4d4] p-4"
                  />
                </CardContent>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-4">

              {judgeResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      {judgeResult.status?.description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      readOnly
                      value={
                        judgeResult.compile_output ||
                        judgeResult.stderr ||
                        judgeResult.stdout ||
                        "No output"
                      }
                      className="font-mono bg-muted"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={runCode} disabled={loading}>
                  <Play className="w-4 h-4 mr-2" /> Run
                </Button>
                <Button onClick={submitCode} disabled={loading}>
                  <Send className="w-4 h-4 mr-2" /> Submit
                </Button>
              </div>

              <Button variant="outline" onClick={() => router.push("/student/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
