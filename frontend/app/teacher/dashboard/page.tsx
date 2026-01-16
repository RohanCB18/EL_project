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
  const [classInfo, setClassInfo] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  return (
    <>
      {/* ERROR POPUP */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-[360px]">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Error</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setErrorMessage(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {errorMessage}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUBMISSIONS POPUP */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-[420px] max-h-[70vh] flex flex-col">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {submissionsTitle}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowSubmissions(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4 space-y-2">
                {submissions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    No submissions yet
                  </p>
                )}
                {submissions.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span>{s.student_name || s.name}</span>
                    {s.score !== undefined && (
                      <span className="font-bold">{s.score}</span>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-3rem)]">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            <div className="space-y-4 pt-4">
              <Button size="lg" onClick={() => router.push("/teacher/quiz-creation")} className="w-full h-14">
                <BookOpen className="w-5 h-5 mr-2" />
                Make Quiz
              </Button>

              <Button size="lg" onClick={() => router.push("/teacher/contest-creation")} className="w-full h-14">
                <Code className="w-5 h-5 mr-2" />
                Make Contest
              </Button>

              <Button size="lg" onClick={() => safePost(quizActive ? "/quizzes/deactivate" : "/quizzes/start")} className="w-full h-14">
                <PlayCircle className="w-5 h-5 mr-2" />
                {quizActive ? "Deactivate Quiz" : "Activate Quiz"}
              </Button>

              <Button size="lg" onClick={() => safePost(contestActive ? "/contests/deactivate" : "/contests/start")} className="w-full h-14">
                <PlayCircle className="w-5 h-5 mr-2" />
                {contestActive ? "Deactivate Contest" : "Activate Contest"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                disabled={!quizActive}
                onClick={() => openSubmissions("quiz")}
                className="w-full h-14"
              >
                <Users className="w-5 h-5 mr-2" />
                View Quiz Submissions
              </Button>

              <Button
                size="lg"
                variant="outline"
                disabled={!contestActive}
                onClick={() => openSubmissions("contest")}
                className="w-full h-14"
              >
                <Users className="w-5 h-5 mr-2" />
                View Contest Submissions
              </Button>

              <Button size="lg" variant="outline" onClick={() => safeDelete("/quizzes/delete")} className="w-full h-14">
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Quiz
              </Button>

              <Button size="lg" variant="outline" onClick={() => safeDelete("/contests/delete")} className="w-full h-14">
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Contest
              </Button>
            </div>

            <div className="flex-1" />

            <Button variant="destructive" size="lg" onClick={handleEndClass} className="w-full h-14">
              <XCircle className="w-5 h-5 mr-2" />
              End Class
            </Button>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="flex flex-col gap-4">
            <Card className="animate-float shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">Classroom Info</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <p className="text-2xl font-bold">{classInfo?.teacher_name}</p>
                <p className="text-muted-foreground">
                  Class ID:{" "}
                  <span className="font-mono text-primary">
                    {classInfo?.room_code}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Doubts
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4 pt-0">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                  {doubts.map((d) => (
                    <div key={d.id} className="p-4 rounded-lg bg-muted/50 group">
                      <p className="font-medium text-sm text-primary">{d.student_name}</p>
                      <p className="text-sm mt-1">{d.content}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => safeDelete(`/doubts/${d.id}`)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>

                <Button
                  variant="outline"
                  onClick={() => safeDelete("/doubts")}
                  disabled={!doubts.length}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Doubts
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Class Leaderboard
            </h2>

            <Card className="flex-1">
              <ScrollArea className="h-[500px] p-4">
                {leaderboard.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 bg-muted/50 rounded-lg mb-2"
                  >
                    <span>{s.name}</span>
                    <span className="font-bold">{s.score}</span>
                  </div>
                ))}
              </ScrollArea>
            </Card>
          </div>

        </div>
      </main>
    </>
  )
}
