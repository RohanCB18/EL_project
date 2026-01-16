"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Code,
  PlayCircle,
  Trophy,
  Trash2,
  XCircle,
  MessageCircle,
  X,
  Users,
  Download,
  Sparkles,
  StopCircle,
  Eye,
  Award,
  AlertCircle,
  Activity,
  CheckCircle2,
} from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

export default function TeacherDashboard() {
  const router = useRouter()

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const [doubts, setDoubts] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [quizActive, setQuizActive] = useState(false)
  const [contestActive, setContestActive] = useState(false)
  const [quizExists, setQuizExists] = useState(false)
  const [contestExists, setContestExists] = useState(false)
  const [classInfo, setClassInfo] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // submissions modal
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [submissionsTitle, setSubmissionsTitle] = useState("")
  const [submissions, setSubmissions] = useState<any[]>([])

  // ---------------- POLLING ----------------
  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }

    const headers = { Authorization: `Bearer ${token}` }

    const poll = async () => {
      try {
        // status
        const statusRes = await fetch(`${BACKEND_URL}/classrooms/status`, { headers })
        const statusData = await statusRes.json()
        if (!statusRes.ok) throw new Error(statusData.detail)

        setQuizActive(statusData.quiz_active)
        setContestActive(statusData.contest_active)
        setQuizExists(statusData.quiz_exists ?? false)
        setContestExists(statusData.contest_exists ?? false)

        // class info
        const infoRes = await fetch(`${BACKEND_URL}/classrooms/info`, { headers })
        const infoData = await infoRes.json()
        if (!infoRes.ok) throw new Error(infoData.detail)
        setClassInfo(infoData)

        // doubts
        const doubtsRes = await fetch(`${BACKEND_URL}/doubts`, { headers })
        const doubtsData = await doubtsRes.json()
        if (!doubtsRes.ok) throw new Error(doubtsData.detail)
        setDoubts(doubtsData.doubts)

        // leaderboard
        const lbRes = await fetch(`${BACKEND_URL}/classrooms/leaderboard`, { headers })
        const lbData = await lbRes.json()
        if (!lbRes.ok) throw new Error(lbData.detail)
        setLeaderboard(lbData.leaderboard)
      } catch (err: any) {
        setErrorMessage(err.message || "Something went wrong")
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [router, token])

  // ---------------- HELPERS ----------------
  const safePost = async (endpoint: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  const safeDelete = async (endpoint: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)

      // Set Success Message based on endpoint
      if (endpoint.includes("quiz")) setSuccessMessage("Quiz data has been deleted.")
      if (endpoint.includes("contest")) setSuccessMessage("Contest data has been deleted.")
      if (endpoint.includes("doubts")) setSuccessMessage("All doubts cleared.")
      
      setTimeout(() => setSuccessMessage(null), 3000) // Auto hide
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  // ---------------- SUBMISSIONS ----------------
  const openSubmissions = async (type: "quiz" | "contest") => {
    try {
      const endpoint =
        type === "quiz"
          ? "/quizzes/submissions"
          : "/contests/submissions"

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)

      setSubmissions(data.submissions ?? data)
      setSubmissionsTitle(
        type === "quiz" ? "Quiz Submissions" : "Contest Submissions"
      )
      setShowSubmissions(true)
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  // ---------------- END CLASS ----------------
  const handleEndClass = async () => {
    await safePost("/classrooms/end")
    localStorage.removeItem("access_token")
    router.push("/")
  }

  const handleDownloadPDF = async () => {
    const res = await fetch(`${BACKEND_URL}/classrooms/leaderboard/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      setErrorMessage("Failed to download leaderboard")
      return
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leaderboard.pdf"
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* SUCCESS POPUP (Deleted Notifications) */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border-b-4 border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* ERROR POPUP */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-[420px] shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-scale-in">
            <CardHeader className="flex flex-row justify-between items-start border-b bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Error</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setErrorMessage(null)} className="hover:bg-red-100">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700">{errorMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBMISSIONS POPUP */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-[480px] max-h-[70vh] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-scale-in">
            <CardHeader className="flex flex-row justify-between items-start border-b bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-gray-800">{submissionsTitle}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSubmissions(false)} className="hover:bg-indigo-100">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full p-4 overflow-y-auto">
                <div className="space-y-2">
                  {submissions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No submissions yet</p>
                    </div>
                  ) : (
                    submissions.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-300"
                      >
                        <span className="font-medium text-gray-800">{s.student_name || s.name}</span>
                        {s.score !== undefined && (
                          <span className="text-xl font-bold text-indigo-600">{s.score}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b shadow-sm backdrop-blur-sm bg-white/90 sticky top-0 z-40">
          <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Kaksha Saathi</h1>
                <p className="text-xs text-gray-500">Teacher Dashboard</p>
              </div>
            </div>

            {classInfo && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <div className="text-left">
                    <p className="text-xs text-indigo-600 font-medium">Room Code</p>
                    <p className="text-lg font-bold text-indigo-900 font-mono tracking-wider">{classInfo.room_code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN - Actions */}
          <div className="space-y-4">
            
            {/* Creation Actions */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg font-bold text-gray-800">Create Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button 
                  size="lg" 
                  onClick={() => router.push("/teacher/quiz-creation")} 
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group font-semibold"
                >
                  <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Make Quiz
                </Button>

                <Button 
                  size="lg" 
                  onClick={() => router.push("/teacher/contest-creation")} 
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group font-semibold"
                >
                  <Code className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Make Contest
                </Button>
              </CardContent>
            </Card>

            {/* Control Actions */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg font-bold text-gray-800">Control Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button 
                  size="lg" 
                  onClick={() => safePost(quizActive ? "/quizzes/deactivate" : "/quizzes/start")} 
                  className={`w-full h-14 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group font-semibold ${
                    quizActive 
                      ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" 
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  }`}
                >
                  {quizActive ? (
                    <>
                      <StopCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Deactivate Quiz
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Activate Quiz
                    </>
                  )}
                </Button>

                <Button 
                  size="lg" 
                  onClick={() => safePost(contestActive ? "/contests/deactivate" : "/contests/start")} 
                  className={`w-full h-14 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group font-semibold ${
                    contestActive 
                      ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" 
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  }`}
                >
                  {contestActive ? (
                    <>
                      <StopCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Deactivate Contest
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Activate Contest
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* View & Delete Actions */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-lg font-bold text-gray-800">Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={!quizActive}
                  onClick={() => openSubmissions("quiz")}
                  className="w-full h-12 border-2 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 disabled:opacity-50 group"
                >
                  <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  View Quiz Submissions
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  disabled={!contestActive}
                  onClick={() => openSubmissions("contest")}
                  className="w-full h-12 border-2 hover:bg-green-50 hover:border-green-400 transition-all duration-300 disabled:opacity-50 group"
                >
                  <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  View Contest Submissions
                </Button>

                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => safeDelete("/quizzes/delete")} 
                  className="w-full h-12 border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all duration-300 group"
                >
                  <Trash2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Delete Quiz
                </Button>

                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => safeDelete("/contests/delete")} 
                  className="w-full h-12 border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all duration-300 group"
                >
                  <Trash2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Delete Contest
                </Button>
              </CardContent>
            </Card>

            <Button 
              variant="destructive" 
              size="lg" 
              onClick={handleEndClass} 
              className="w-full h-14 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl group font-semibold"
            >
              <XCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              End Class
            </Button>
          </div>

          {/* MIDDLE COLUMN - Doubts */}
          <div className="space-y-4">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Student Doubts</h2>
                    <p className="text-xs text-gray-500 font-normal">{doubts.length} active questions</p>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {doubts.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No doubts yet</p>
                      </div>
                    ) : (
                      doubts.map((d, idx) => (
                        <div 
                          key={d.id} 
                          className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all duration-300"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-purple-900 mb-1">{d.student_name}</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{d.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => safeDelete(`/doubts/${d.id}`)}
                              className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    onClick={() => safeDelete("/doubts")}
                    disabled={!doubts.length}
                    className="w-full h-11 border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all duration-300 disabled:opacity-50 group font-semibold"
                  >
                    <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Clear All Doubts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Status & Leaderboard */}
          <div className="space-y-4">
            
            {/* STATUS CARD */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="py-3 border-b bg-slate-50">
                <CardTitle className="text-sm font-bold text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                {/* Quiz Status */}
                <div className={`p-3 rounded-xl border-2 transition-all duration-300 ${quizExists ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                  <p className="text-[10px] uppercase tracking-tighter font-black text-gray-400 mb-2">Quiz Modules</p>
                  <div className="space-y-2">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Active</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${quizActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                </div>

                {/* Contest Status */}
                <div className={`p-3 rounded-xl border-2 transition-all duration-300 ${contestExists ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                  <p className="text-[10px] uppercase tracking-tighter font-black text-gray-400 mb-2">Contest Modules</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Active</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${contestActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LEADERBOARD */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Leaderboard</h2>
                    <p className="text-xs text-gray-500 font-normal">Top performers</p>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No scores yet</p>
                      </div>
                    ) : (
                      leaderboard.map((s, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                            i === 0
                              ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 hover:border-yellow-400"
                              : i === 1
                              ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:border-gray-400"
                              : i === 2
                              ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 hover:border-orange-400"
                              : "bg-gray-50 border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                              i === 0
                                ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                                : i === 1
                                ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                                : i === 2
                                ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white"
                                : "bg-indigo-100 text-indigo-700"
                            }`}>
                              {i < 3 ? <Award className="w-5 h-5" /> : i + 1}
                            </div>
                            <span className="font-semibold text-gray-800">{s.name}</span>
                          </div>
                          <span className={`text-2xl font-bold ${
                            i === 0 ? "text-yellow-600" :
                            i === 1 ? "text-gray-600" :
                            i === 2 ? "text-orange-600" :
                            "text-indigo-600"
                          }`}>
                            {s.score}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="w-full h-11 border-2 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2 group-hover:translate-y-1 transition-transform duration-300" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}