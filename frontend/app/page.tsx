"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GraduationCap, Sparkles, ArrowRight, User, Mail } from "lucide-react"

const BACKEND_URL = "http://localhost:8000"

export default function LoginPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"student" | "teacher" | "">("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (!name || !email || !role) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Login failed")
      }

      const { access_token, id } = data

      // Store auth data
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("role", role)
      localStorage.setItem("user_id", String(id))
      localStorage.setItem("name", name)
      localStorage.setItem("email", email)

      // Route ONLY based on role
      if (role === "student") {
        router.push("/student/join")
      } else {
        router.push("/teacher/class-selection")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Kaksha Saathi
            </CardTitle>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
              <p className="text-sm font-medium">Your intelligent classroom companion</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10">
          {/* Name Input */}
          <div className="space-y-3 group">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Full Name
            </Label>
            <div className="relative">
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base group-hover:border-indigo-300"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-3 group">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-4 pr-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base group-hover:border-indigo-300"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-700">Select Your Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as "student" | "teacher")}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative group">
                <Label
                  htmlFor="student"
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    role === "student"
                      ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md scale-105"
                      : "border-gray-200 bg-white/50 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <RadioGroupItem value="student" id="student" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    role === "student" 
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg" 
                      : "bg-gray-100 group-hover:bg-indigo-100"
                  }`}>
                    <GraduationCap className={`w-6 h-6 ${role === "student" ? "text-white" : "text-gray-600 group-hover:text-indigo-600"}`} />
                  </div>
                  <span className={`font-semibold text-base transition-colors ${
                    role === "student" ? "text-indigo-700" : "text-gray-700 group-hover:text-indigo-600"
                  }`}>
                    Student
                  </span>
                  {role === "student" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </Label>
              </div>

              <div className="relative group">
                <Label
                  htmlFor="teacher"
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    role === "teacher"
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md scale-105"
                      : "border-gray-200 bg-white/50 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <RadioGroupItem value="teacher" id="teacher" className="sr-only" />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    role === "teacher" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg" 
                      : "bg-gray-100 group-hover:bg-purple-100"
                  }`}>
                    <User className={`w-6 h-6 ${role === "teacher" ? "text-white" : "text-gray-600 group-hover:text-purple-600"}`} />
                  </div>
                  <span className={`font-semibold text-base transition-colors ${
                    role === "teacher" ? "text-purple-700" : "text-gray-700 group-hover:text-purple-600"
                  }`}>
                    Teacher
                  </span>
                  {role === "teacher" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!name || !email || !role || loading}
            className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
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
      `}</style>
    </main>
  )
}