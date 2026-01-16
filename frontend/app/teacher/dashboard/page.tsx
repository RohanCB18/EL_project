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
  ChevronRight,
} from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

export default function TeacherDashboard() {
  const router = useRouter()
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const [doubts, setDoubts] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [quizActive, setQuizActive] = useState(false)
  const [contestActive, setContestActive] = useState(false)
  const [quizExists, setQuizExists] = useState(false)
  const [contestExists, setContestExists] = useState(false)
  const [classInfo, setClassInfo] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [showSubmissions, setShowSubmissions] = useState(false)
  const [submissionsTitle, setSubmissionsTitle] = useState("")
  const [submissions, setSubmissions] = useState<any[]>([])

  // ---------------- POLLING (UNCHANGED) ----------------
  useEffect(() => {
    if (!token) {
      router.push("/")
      return
    }
    const headers = { Authorization: `Bearer ${token}` }
    const poll = async () => {
      try {
        const statusRes = await fetch(`${BACKEND_URL}/classrooms/status`, { headers })
        const statusData = await statusRes.json()
        if (!statusRes.ok) throw new Error(statusData.detail)
        setQuizActive(statusData.quiz_active)
        setContestActive(statusData.contest_active)
        setQuizExists(statusData.quiz_exists ?? false)
        setContestExists(statusData.contest_exists ?? false)

        const infoRes = await fetch(`${BACKEND_URL}/classrooms/info`, { headers })
        const infoData = await infoRes.json()
        if (infoRes.ok) setClassInfo(infoData)

        const doubtsRes = await fetch(`${BACKEND_URL}/doubts`, { headers })
        if (doubtsRes.ok) {
          const d = await doubtsRes.json()
          setDoubts(d.doubts)
        }

        const lbRes = await fetch(`${BACKEND_URL}/classrooms/leaderboard`, { headers })
        if (lbRes.ok) {
          const l = await lbRes.json()
          setLeaderboard(l.leaderboard)
        }
      } catch (err: any) {
        console.error(err.message)
      }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [router, token])

  // ---------------- HELPERS (UNCHANGED) ----------------
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
      if (endpoint.includes("quiz")) setSuccessMessage("Quiz data has been deleted.")
      if (endpoint.includes("contest")) setSuccessMessage("Contest data has been deleted.")
      if (endpoint.includes("doubts")) setSuccessMessage("All doubts cleared.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  const openSubmissions = async (type: "quiz" | "contest") => {
    try {
      const endpoint = type === "quiz" ? "/quizzes/submissions" : "/contests/submissions"
      const res = await fetch(`${BACKEND_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setSubmissions(data.submissions ?? data)
      setSubmissionsTitle(type === "quiz" ? "Quiz Submissions" : "Contest Submissions")
      setShowSubmissions(true)
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  const handleEndClass = async () => {
    await safePost("/classrooms/end")
    localStorage.removeItem("access_token")
    router.push("/")
  }

  const handleDownloadPDF = async () => {
    const res = await fetch(`${BACKEND_URL}/classrooms/leaderboard/pdf`, { headers: { Authorization: `Bearer ${token}` } })
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
    <main className="min-h-screen bg-[#F4F4F7] text-[#111111] antialiased">
      {/* NOTIFICATIONS */}
      {successMessage && (
        <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-[11px] font-black uppercase tracking-widest">{successMessage}</span>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <nav className="h-20 bg-white border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-xl rotate-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">Kaksha Saathi</h1>
          </div>
          {classInfo && (
            <div className="flex items-center gap-3 px-6 py-2 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]" />
              <div className="text-left font-mono">
                <p className="text-[9px] text-indigo-400 font-black uppercase">Room Code</p>
                <p className="text-lg font-bold tracking-tighter">{classInfo.room_code}</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <Card className="w-[500px] border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <div className="p-8 border-b border-black/5 bg-[#FBFBFC] flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">{submissionsTitle}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSubmissions(false)} className="rounded-full"><X className="w-5 h-5" /></Button>
            </div>
            <ScrollArea className="h-[400px] p-6 bg-white">
              <div className="space-y-3">
                {submissions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-[#F4F4F7] border border-black/[0.03] rounded-2xl">
                    <span className="text-sm font-bold uppercase tracking-tight">{s.student_name || s.name}</span>
                    <span className="text-lg font-black text-indigo-600">{s.score ?? '--'}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6 flex flex-col min-h-[85vh]">
          <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b bg-[#FBFBFC] p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-black/40">Create Content</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button size="lg" onClick={() => router.push("/teacher/quiz-creation")} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:translate-y-[-2px] transition-all">
                <BookOpen className="w-5 h-5 mr-3" /> Make Quiz
              </Button>
              <Button size="lg" onClick={() => router.push("/teacher/contest-creation")} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:translate-y-[-2px] transition-all">
                <Code className="w-5 h-5 mr-3" /> Make Contest
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b bg-[#FBFBFC] p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-black/40">Control Panel</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button onClick={() => safePost(quizActive ? "/quizzes/deactivate" : "/quizzes/start")} className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${quizActive ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                {quizActive ? <><StopCircle className="w-4 h-4 mr-2" /> Deactivate Quiz</> : <><PlayCircle className="w-4 h-4 mr-2" /> Activate Quiz</>}
              </Button>
              <Button onClick={() => safePost(contestActive ? "/contests/deactivate" : "/contests/start")} className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${contestActive ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                {contestActive ? <><StopCircle className="w-4 h-4 mr-2" /> Deactivate Contest</> : <><PlayCircle className="w-4 h-4 mr-2" /> Activate Contest</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b bg-[#FBFBFC] p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-black/40">Manage</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={!quizActive} onClick={() => openSubmissions("quiz")} className="h-12 border-2 rounded-xl font-bold uppercase text-[9px]">View Quiz Submissions</Button>
                <Button variant="outline" disabled={!contestActive} onClick={() => openSubmissions("contest")} className="h-12 border-2 rounded-xl font-bold uppercase text-[9px]">View Contest Submissions</Button>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5">
                <Button variant="outline" onClick={() => safeDelete("/quizzes/delete")} className="h-12 border-2 rounded-xl font-bold uppercase text-[9px] text-red-500">Delete Quiz</Button>
                <Button variant="outline" onClick={() => safeDelete("/contests/delete")} className="h-12 border-2 rounded-xl font-bold uppercase text-[9px] text-red-500">Delete Contest</Button>
              </div>
            </CardContent>
          </Card>

          <Button variant="destructive" onClick={handleEndClass} className="w-full h-16 bg-red-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:translate-y-[-2px] transition-all mt-auto">
            <XCircle className="w-5 h-5 mr-3" /> End Class
          </Button>
        </div>

        {/* MIDDLE COLUMN - Student Doubts */}
        <div className="lg:col-span-4 flex flex-col h-[85vh]">
          <Card className="flex-1 bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-[#FBFBFC] p-8 flex flex-row items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg"><MessageCircle className="w-5 h-5 text-white" /></div>
              <CardTitle className="text-xl font-black uppercase tracking-tight italic leading-none">Student Doubts</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {doubts.map((d) => (
                  <div key={d.id} className="group p-5 bg-[#F4F4F7] rounded-[1.5rem] border border-transparent hover:border-indigo-200 transition-all flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{d.student_name}</p>
                      <p className="text-sm font-medium text-black/80">{d.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => safeDelete(`/doubts/${d.id}`)} className="text-black/10 hover:text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-6 bg-[#FBFBFC] border-t">
              <Button variant="outline" onClick={() => safeDelete("/doubts")} disabled={!doubts.length} className="w-full h-12 border-2 border-red-100 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50">Clear All Doubts</Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - Leaderboard */}
        <div className="lg:col-span-4 flex flex-col h-[85vh] space-y-6">
          <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-6 grid grid-cols-2 gap-4 flex-shrink-0">
             <div className="p-4 rounded-2xl bg-[#FBFBFC] border-2 border-black/[0.03] flex flex-col items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${quizActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-black/10'}`} />
                <span className="text-[9px] font-black uppercase text-black/30 tracking-widest">Quiz Live</span>
             </div>
             <div className="p-4 rounded-2xl bg-[#FBFBFC] border-2 border-black/[0.03] flex flex-col items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${contestActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-black/10'}`} />
                <span className="text-[9px] font-black uppercase text-black/30 tracking-widest">Contest Live</span>
             </div>
          </Card>

          <Card className="flex-1 bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden flex flex-col">
            <div className="p-8 border-b bg-[#FBFBFC] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg"><Trophy className="w-5 h-5 text-white" /></div>
                <CardTitle className="text-xl font-black uppercase tracking-tight italic">Leaderboard</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDownloadPDF} className="rounded-xl bg-white border border-black/5 hover:bg-black hover:text-white transition-all"><Download className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-2">
                {leaderboard.map((s, i) => (
                  <div key={i} className={`flex justify-between items-center p-5 rounded-2xl border transition-all ${i === 0 ? 'bg-black text-white shadow-xl scale-[1.02] border-black' : 'bg-[#FBFBFC] border-transparent hover:border-black/5'}`}>
                    <span className="font-black text-xs uppercase tracking-tight">{s.name}</span>
                    <span className={`text-sm font-black ${i === 0 ? 'text-white' : 'text-indigo-600'}`}>{s.score}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </main>
  )
}