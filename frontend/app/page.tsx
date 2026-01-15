"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, BookOpen, Users, Sparkles } from "lucide-react"
import StudentDashboard from "@/components/student-dashboard"
import TeacherDashboard from "@/components/teacher-dashboard"

export default function Home() {
  const [userType, setUserType] = useState<"student" | "teacher" | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    if (email && password && userType) {
      setIsLoggedIn(true)
    }
  }

  if (isLoggedIn && userType === "student") {
    return <StudentDashboard />
  }

  if (isLoggedIn && userType === "teacher") {
    return <TeacherDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium animate-float">
            <Sparkles className="w-4 h-4" />
            Welcome to RVCE Learning Hub
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-balance bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent">
            Learn, Connect, Excel
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            Your comprehensive platform for assessments, mentorship, and collaborative learning at RVCE
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Quizzes</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-secondary/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="p-3 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-sm font-medium">Teams</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-accent/50 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <span className="text-sm font-medium">Mentors</span>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <Card className="shadow-2xl border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Choose your role and enter your credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User type selection */}
            <div className="space-y-3">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={userType === "student" ? "default" : "outline"}
                  className={`h-auto py-4 flex flex-col gap-2 transition-all duration-300 ${
                    userType === "student"
                      ? "shadow-lg scale-105"
                      : "hover:scale-105 hover:border-primary/50 hover:shadow-md"
                  }`}
                  onClick={() => setUserType("student")}
                >
                  <GraduationCap className={`w-6 h-6 ${userType === "student" ? "animate-bounce" : ""}`} />
                  <span className="font-semibold">Student</span>
                </Button>
                <Button
                  type="button"
                  variant={userType === "teacher" ? "default" : "outline"}
                  className={`h-auto py-4 flex flex-col gap-2 transition-all duration-300 ${
                    userType === "teacher"
                      ? "shadow-lg scale-105"
                      : "hover:scale-105 hover:border-primary/50 hover:shadow-md"
                  }`}
                  onClick={() => setUserType("teacher")}
                >
                  <BookOpen className={`w-6 h-6 ${userType === "teacher" ? "animate-bounce" : ""}`} />
                  <span className="font-semibold">Teacher</span>
                </Button>
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email">RVCE Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@rvce.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
              />
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
              />
            </div>

            {/* Login button */}
            <Button
              className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              onClick={handleLogin}
              disabled={!userType || !email || !password}
            >
              Sign In as {userType === "student" ? "Student" : userType === "teacher" ? "Teacher" : "User"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <button className="hover:text-primary hover:underline transition-colors">Forgot password?</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
