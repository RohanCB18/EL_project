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
import {
  Play,
  Send,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Code2,
  FileText,
  Trophy,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react"

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
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const [activeTab, setActiveTab] = useState<"description" | "testcases">("description")
  const [resultTab, setResultTab] = useState<"result" | "tips">("tips")

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
        setSamples(await s.json())
      }
    }

    load()
  }, [router, token])

  // ---------------- RUN ----------------
  const runCode = async () => {
    if (!token) return
    setLoading(true)
    setJudgeResult(null)
    setResultTab("result")

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

    setJudgeResult(await res.json())
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
      setLoading(false)
      return
    }

    setScore(data.score)
    setSubmitted(true)
    setLoading(false)

    setTimeout(() => {
      router.push("/student/dashboard")
    }, 3000)
  }

  if (!question) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-600">Loading contest...</p>
      </div>
    </div>
  )

  return (
    <main className="h-screen bg-white flex flex-col overflow-hidden">
      
      {/* Top Navigation Bar */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
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
          <h1 className="text-lg font-semibold text-gray-800">{question.title}</h1>
        </div>
        <div className="text-sm text-gray-500">Contest Mode</div>
      </div>

      {(submitted || alreadySubmitted) ? (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Card className="max-w-md w-full shadow-2xl border-0 bg-white/90 backdrop-blur-sm transform transition-all duration-500 animate-scale-in">
            <CardContent className="text-center space-y-6 py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-500 hover:scale-110">
                  <CheckCircle className="w-14 h-14 text-white animate-bounce-slow" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {submitted ? "Submission Successful!" : "Already Submitted"}
                </h3>
                {submitted && score !== null && (
                  <div className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-700">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    Score: {score}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Clock className="w-4 h-4 animate-pulse" />
                <p className="text-sm">Redirecting to dashboard...</p>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full animate-progress"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL - Problem Description */}
          <div className="w-1/2 border-r flex flex-col bg-white">
            
            {/* Tabs */}
            <div className="h-12 border-b flex items-center px-4 gap-1 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setActiveTab("description")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "description"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("testcases")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "testcases"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                Test Cases
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "description" ? (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h2>
                    <p className="text-gray-700 leading-relaxed">{question.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        Input Format
                      </h3>
                      <p className="text-sm text-gray-700">{question.input_format}</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        Output Format
                      </h3>
                      <p className="text-sm text-gray-700">{question.output_format}</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        Constraints
                      </h3>
                      <p className="text-sm text-gray-700">{question.constraints}</p>
                    </div>
                  </div>

                  {samples.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Examples</h3>
                      {samples.slice(0, 2).map((s, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="font-semibold text-sm text-gray-700">Example {i + 1}</div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Input:</div>
                            <pre className="bg-white border border-gray-200 rounded p-3 text-sm font-mono text-gray-800 overflow-x-auto">{s.input_data}</pre>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">Output:</div>
                            <pre className="bg-white border border-gray-200 rounded p-3 text-sm font-mono text-gray-800 overflow-x-auto">{s.expected_output}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Test Cases</h3>
                  {samples.map((s, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                      <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        Test Case {i + 1}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">Input</div>
                          <pre className="bg-white border border-gray-200 rounded p-3 text-xs font-mono text-gray-800 overflow-x-auto max-h-32">{s.input_data}</pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">Expected Output</div>
                          <pre className="bg-white border border-gray-200 rounded p-3 text-xs font-mono text-gray-800 overflow-x-auto max-h-32">{s.expected_output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Code Editor */}
          <div className="w-1/2 flex flex-col bg-white">
            
            {/* Editor Header */}
            <div className="h-12 border-b flex items-center justify-between px-4 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Code</span>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40 h-9 text-sm border-gray-300 hover:border-indigo-400 transition-colors duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpp">C++ 17</SelectItem>
                  <SelectItem value="python">Python 3</SelectItem>
                  <SelectItem value="java">Java 11</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write your code here..."
                className="h-full w-full font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] p-4 border-0 rounded-none resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Bottom Panel - Results/Tips */}
            <div className="h-64 border-t flex flex-col bg-white flex-shrink-0">
              {/* Result Tabs */}
              <div className="h-10 border-b flex items-center px-4 gap-1 bg-gray-50">
                <button
                  onClick={() => setResultTab("tips")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 ${
                    resultTab === "tips"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Tips
                </button>
                <button
                  onClick={() => setResultTab("result")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 ${
                    resultTab === "result"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {judgeResult ? "Test Result" : "Result"}
                </button>
              </div>

              {/* Result Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {resultTab === "tips" ? (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-amber-900 text-sm">Quick Tips</h4>
                      <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                        <li>Test your code with sample inputs before submitting</li>
                        <li>Consider edge cases and boundary conditions</li>
                        <li>Check time and space complexity requirements</li>
                        <li>Use meaningful variable names for clarity</li>
                      </ul>
                    </div>
                  </div>
                ) : judgeResult ? (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      judgeResult.status?.id === 3
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      {judgeResult.status?.id === 3 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        judgeResult.status?.id === 3 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {judgeResult.status?.description || "Result"}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2">Output:</div>
                      <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono text-gray-800 overflow-auto max-h-32">
{judgeResult.compile_output || judgeResult.stderr || judgeResult.stdout || "No output"}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    Run your code to see results here
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="h-16 border-t flex items-center justify-end gap-3 px-4 bg-gray-50 flex-shrink-0">
              <Button
                onClick={runCode}
                disabled={loading || !code.trim()}
                variant="outline"
                className="h-10 px-6 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Run
                  </>
                )}
              </Button>
              <Button
                onClick={submitCode}
                disabled={loading || !code.trim()}
                className="h-10 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group font-medium shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform duration-200" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

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

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 3s ease-in-out;
        }
      `}</style>
    </main>
  )
}