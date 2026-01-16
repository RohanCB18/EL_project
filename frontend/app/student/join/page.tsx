"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Lock, Hash, CheckCircle, Loader2, Sparkles } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

export default function StudentJoinPage() {
  const router = useRouter()

  const [classCode, setClassCode] = useState("")
  const [classPassword, setClassPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // 🔹 Check if student already in a classroom
  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem("access_token")
      if (!token) return

      try {
        const res = await fetch(`${BACKEND_URL}/classrooms/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        if (!res.ok) return

        if (data.current_classroom_id !== null) {
          setInfoMessage("You are already in a classroom. Redirecting...")
          setTimeout(() => {
            router.push("/student/dashboard")
          }, 800)
        }
      } catch {
        // silent fail — join page will still work
      }
    }

    checkStatus()
  }, [router])

  const handleJoinClass = async () => {
    if (!classCode || !classPassword) return

    const token = localStorage.getItem("access_token")
    if (!token) {
      setError("You are not logged in. Please login again.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/classrooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_code: classCode,
          password: classPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Failed to join classroom")
      }

      router.push("/student/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && classCode && classPassword && !loading) {
      handleJoinClass()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-lg shadow-2xl border-0 backdrop-blur-sm bg-white/90 relative z-10 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
        <CardHeader className="text-center pb-8 pt-10 space-y-4">
          <div className="mx-auto mb-2 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transform transition-all duration-500 hover:rotate-12 hover:scale-110 shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Join Classroom
            </CardTitle>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
              <p className="text-sm font-medium">Enter your classroom details</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10">
          
          {/* Info Message */}
          {infoMessage && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3 animate-slide-in">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">{infoMessage}</p>
            </div>
          )}

          {/* Class Code Input */}
          <div className="space-y-3 group">
            <Label htmlFor="classCode" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              Class Code
            </Label>
            <div className="relative">
              <Input
                id="classCode"
                placeholder="Enter 6-character class code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                maxLength={6}
                className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base font-mono uppercase tracking-wider text-center group-hover:border-indigo-300"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">Ask your teacher for the class code</p>
          </div>

          {/* Class Password Input */}
          <div className="space-y-3 group">
            <Label htmlFor="classPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              Class Password
            </Label>
            <div className="relative">
              <Input
                id="classPassword"
                type="password"
                placeholder="Enter classroom password"
                value={classPassword}
                onChange={(e) => setClassPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base group-hover:border-indigo-300"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Join Button */}
          <Button
            onClick={handleJoinClass}
            disabled={loading || !classCode || !classPassword}
            className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining Classroom...
                </>
              ) : (
                <>
                  Join Classroom
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Button>

          {/* Help Text */}
          <div className="pt-4 border-t border-gray-200">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Need Help?
              </h4>
              <ul className="text-xs text-indigo-700 space-y-1">
                <li>• Get the class code from your teacher</li>
                <li>• Make sure you enter the code correctly</li>
                <li>• Password is case-sensitive</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </main>
  )
}