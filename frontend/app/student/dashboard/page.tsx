"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Trophy, LogOut, BookOpen, Code } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

export default function StudentDashboard() {
  const router = useRouter()

  const [doubts, setDoubts] = useState<any[]>([])
  const [newDoubt, setNewDoubt] = useState("")
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [quizActive, setQuizActive] = useState(false)
  const [contestActive, setContestActive] = useState(false)
  const [classInfo, setClassInfo] = useState<{
    room_code: string
    teacher_name: string
  } | null>(null)

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const name =
    typeof window !== "undefined"
      ? localStorage.getItem("name") || ""
      : ""

  const email =
    typeof window !== "undefined"
      ? localStorage.getItem("email") || ""
      : ""

  // ---------------- INITIAL LOAD + POLLING ----------------
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

        if (!statusRes.ok || statusData.current_classroom_id === null) {
          router.push("/student/join")
          return
        }

        setQuizActive(statusData.quiz_active)
        setContestActive(statusData.contest_active)

        // classroom info (static but cheap)
        const infoRes = await fetch(`${BACKEND_URL}/classrooms/info`, { headers })
        if (infoRes.ok) {
          const infoData = await infoRes.json()
          setClassInfo(infoData)
        }

        // doubts
        const doubtsRes = await fetch(`${BACKEND_URL}/doubts`, { headers })
        if (doubtsRes.ok) {
          const d = await doubtsRes.json()
          setDoubts(d.doubts)
        }

        // leaderboard
        const lbRes = await fetch(
          `${BACKEND_URL}/classrooms/leaderboard/student`,
          { headers }
        )
        if (lbRes.ok) {
          const l = await lbRes.json()
          setLeaderboard(l.leaderboard)
        }
      } catch {
        // polling must never crash UI
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [router, token])

  const submitDoubt = async () => {
    if (!newDoubt.trim() || !token) return

    await fetch(`${BACKEND_URL}/doubts/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newDoubt }),
    })

    setNewDoubt("")
  }

  return (
    <main className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-3rem)]">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          <div className="pt-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Doubts
            </h2>
          </div>

          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-4">
              <ScrollArea className="flex-1">
                {doubts.map((d) => (
                  <div key={d.id} className="p-4 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm text-primary">{d.student_name}</p>
                    <p className="text-sm mt-1">{d.content}</p>
                  </div>
                ))}
              </ScrollArea>

              <div className="pt-4 mt-4 border-t space-y-3">
                <Input
                  placeholder="Ask a doubt..."
                  value={newDoubt}
                  onChange={(e) => setNewDoubt(e.target.value)}
                />
                <Button className="w-full" onClick={submitDoubt}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col gap-6">
          <Card className="animate-float shadow-lg">
            <CardContent className="py-10 text-center space-y-2">
              <p className="text-4xl font-bold tracking-wider text-primary font-mono">
                {classInfo?.room_code}
              </p>
              <p className="text-sm text-muted-foreground">
                Teacher: {classInfo?.teacher_name}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6 flex-1 justify-center">
            <Button
              size="lg"
              disabled={!quizActive}
              onClick={() => router.push("/student/quiz")}
              className={`h-28 text-xl ${quizActive ? "" : "opacity-50 cursor-not-allowed"}`}
            >
              <BookOpen className="w-7 h-7 mr-3" />
              Take Quiz
            </Button>

            <Button
              size="lg"
              disabled={!contestActive}
              onClick={() => router.push("/student/contest")}
              className={`h-28 text-xl ${contestActive ? "" : "opacity-50 cursor-not-allowed"}`}
            >
              <Code className="w-7 h-7 mr-3" />
              Take Contest
            </Button>

            <Button variant="destructive" className="w-fit" onClick={() => router.push("/")}>
              <LogOut className="w-4 h-4 mr-2" />
              Leave Class
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar>
                <AvatarFallback>{name ? name[0].toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-2">
                  {leaderboard.map((s) => (
                    <div key={s.rank} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span>{s.name}</span>
                      <span className="font-bold text-primary">{s.score}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </main>
  )
}
