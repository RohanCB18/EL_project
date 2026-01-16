"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Trophy, LogOut, BookOpen, Code, Send, Sparkles, Zap, Users, Award } from "lucide-react"

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submitDoubt()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b shadow-sm backdrop-blur-sm bg-white/90 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Kaksha Saathi</h1>
              <p className="text-xs text-gray-500">Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {classInfo && (
              <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <Users className="w-4 h-4 text-indigo-600" />
                <div className="text-left">
                  <p className="text-xs text-indigo-600 font-medium">Room Code</p>
                  <p className="text-lg font-bold text-indigo-900 font-mono tracking-wider">{classInfo.room_code}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
              Leave Class
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-5rem)]">

        {/* LEFT COLUMN - Doubts */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 flex flex-col shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Doubts</h2>
                  <p className="text-xs text-gray-500 font-normal">Ask questions, get help</p>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {doubts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No doubts yet. Be the first to ask!</p>
                    </div>
                  ) : (
                    doubts.map((d, idx) => (
                      <div 
                        key={d.id} 
                        className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all duration-300 animate-slide-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-purple-600 text-white text-xs">
                              {d.student_name ? d.student_name[0].toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-semibold text-sm text-purple-900">{d.student_name}</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{d.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-gray-50 space-y-3">
                <Input
                  placeholder="Type your doubt here..."
                  value={newDoubt}
                  onChange={(e) => setNewDoubt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                />
                <Button 
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group font-semibold"
                  onClick={submitDoubt}
                  disabled={!newDoubt.trim()}
                >
                  <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                  Submit Doubt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE COLUMN - Actions */}
        <div className="flex flex-col gap-6">
          
          {/* Teacher Info Card */}
          {classInfo && (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 animate-fade-in">
              <CardContent className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Teacher</p>
                  <p className="text-2xl font-bold text-gray-800">{classInfo.teacher_name}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex-1 flex flex-col justify-center gap-6">
            
            {/* Quiz Button */}
            <div className="relative group">
              {quizActive && (
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 animate-pulse transition duration-300"></div>
              )}
              <Button
                size="lg"
                disabled={!quizActive}
                onClick={() => router.push("/student/quiz")}
                className={`relative w-full h-32 text-xl rounded-2xl transition-all duration-300 transform ${
                  quizActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-2xl group"
                    : "bg-gray-300 cursor-not-allowed opacity-50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    quizActive ? "bg-white/20" : "bg-white/10"
                  }`}>
                    <BookOpen className={`w-8 h-8 ${quizActive ? "text-white group-hover:scale-110 transition-transform duration-300" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-bold">Take Quiz</p>
                    {quizActive && (
                      <p className="text-xs text-white/80 flex items-center justify-center gap-1 mt-1">
                        <Zap className="w-3 h-3 animate-pulse" />
                        Active Now
                      </p>
                    )}
                    {!quizActive && (
                      <p className="text-xs text-gray-500 mt-1">No active quiz</p>
                    )}
                  </div>
                </div>
                {quizActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                )}
              </Button>
            </div>

            {/* Contest Button */}
            <div className="relative group">
              {contestActive && (
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-50 animate-pulse transition duration-300"></div>
              )}
              <Button
                size="lg"
                disabled={!contestActive}
                onClick={() => router.push("/student/contest")}
                className={`relative w-full h-32 text-xl rounded-2xl transition-all duration-300 transform ${
                  contestActive
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-[1.02] hover:shadow-2xl group"
                    : "bg-gray-300 cursor-not-allowed opacity-50"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    contestActive ? "bg-white/20" : "bg-white/10"
                  }`}>
                    <Code className={`w-8 h-8 ${contestActive ? "text-white group-hover:scale-110 transition-transform duration-300" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-bold">Take Contest</p>
                    {contestActive && (
                      <p className="text-xs text-white/80 flex items-center justify-center gap-1 mt-1">
                        <Zap className="w-3 h-3 animate-pulse" />
                        Active Now
                      </p>
                    )}
                    {!contestActive && (
                      <p className="text-xs text-gray-500 mt-1">No active contest</p>
                    )}
                  </div>
                </div>
                {contestActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Profile & Leaderboard */}
        <div className="flex flex-col gap-4">
          
          {/* Profile Card */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-4 border-indigo-200 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold">
                    {name ? name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-800">{name}</p>
                  <p className="text-sm text-gray-500">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="flex-1 shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 flex flex-col animate-fade-in">
            <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50 pb-4">
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
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No scores yet. Be the first!</p>
                    </div>
                  ) : (
                    leaderboard.map((s, idx) => (
                      <div 
                        key={s.rank} 
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md animate-slide-in ${
                          idx === 0 
                            ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 hover:border-yellow-400" 
                            : idx === 1
                            ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:border-gray-400"
                            : idx === 2
                            ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 hover:border-orange-400"
                            : "bg-gray-50 border-gray-200 hover:border-indigo-300"
                        }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                            idx === 0 
                              ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" 
                              : idx === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                              : idx === 2
                              ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white"
                              : "bg-indigo-100 text-indigo-700"
                          }`}>
                            {idx < 3 ? (
                              <Award className="w-5 h-5" />
                            ) : (
                              s.rank
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">Rank #{s.rank}</p>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${
                          idx === 0 ? "text-yellow-600" :
                          idx === 1 ? "text-gray-600" :
                          idx === 2 ? "text-orange-600" :
                          "text-indigo-600"
                        }`}>
                          {s.score}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
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

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </main>
  )
}