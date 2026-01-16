"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BookOpen, Lock, Sparkles, Users, Code, FileQuestion, ArrowRight, Loader2 } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

export default function TeacherClassSelectionPage() {
  const router = useRouter()
  const [className, setClassName] = useState("")
  const [classPassword, setClassPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  // Auto-redirect if teacher already has a classroom
  useEffect(() => {
    if (!token) return

    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/classrooms/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) return

        const data = await res.json()

        if (data.classroom_id) {
          router.replace("/teacher/dashboard")
        }
      } catch {
        // silent
      }
    }

    checkStatus()
  }, [router, token])

  const handleCreateClass = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/classrooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_name: className,
          password: classPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create classroom")
      }

      router.push("/teacher/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && className && classPassword && !loading) {
      handleCreateClass()
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        
        {/* Welcome Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Kaksha Saathi
          </h1>
          <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            Create and manage your classroom
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 transform transition-all duration-500 hover:shadow-3xl">
          <CardHeader className="text-center pb-8 pt-10 space-y-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="mx-auto mb-2 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transform transition-all duration-500 hover:rotate-12 hover:scale-110 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-800">
                Create Your Classroom
              </CardTitle>
              <p className="text-sm text-gray-500">Set up your virtual learning space</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 py-8">
            
            {/* Class Name Input */}
            <div className="space-y-3 group">
              <Label htmlFor="className" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Class Name
              </Label>
              <div className="relative">
                <Input
                  id="className"
                  placeholder="e.g., Computer Science 101"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base group-hover:border-indigo-300"
                />
              </div>
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
                  placeholder="Create a secure password"
                  value={classPassword}
                  onChange={(e) => setClassPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base group-hover:border-indigo-300"
                />
              </div>
              <p className="text-xs text-gray-500">Students will need this password to join your class</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateClass}
              disabled={loading || !className || !classPassword}
              className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Classroom...
                  </>
                ) : (
                  <>
                    Create Classroom
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>

            {/* Quick Actions */}
            <div className="pt-6 border-t space-y-4">
              <p className="text-sm font-semibold text-gray-700 text-center">Quick Actions</p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/teacher/quiz-creation")}
                  className="h-24 border-2 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center justify-center gap-2 group transform hover:scale-[1.02]"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileQuestion className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-blue-700">My Quizzes</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/teacher/contest-creation")}
                  className="h-24 border-2 hover:border-green-400 hover:bg-green-50 transition-all duration-300 flex flex-col items-center justify-center gap-2 group transform hover:scale-[1.02]"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Code className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-green-700">My Contests</span>
                </Button>
              </div>
              <p className="text-xs text-center text-gray-500">Manage your quizzes and contests before creating a class</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
      `}</style>
    </main>
  )
}