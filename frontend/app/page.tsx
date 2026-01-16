"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GraduationCap } from "lucide-react"

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
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome to Kaksha Saathi
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Your classroom companion
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as "student" | "teacher")}
              className="flex gap-4"
            >
              <div className="flex-1">
                <Label
                  htmlFor="student"
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    role === "student"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <RadioGroupItem value="student" id="student" className="sr-only" />
                  <span className="font-medium">Student</span>
                </Label>
              </div>

              <div className="flex-1">
                <Label
                  htmlFor="teacher"
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    role === "teacher"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <RadioGroupItem value="teacher" id="teacher" className="sr-only" />
                  <span className="font-medium">Teacher</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            onClick={handleContinue}
            disabled={!name || !email || !role || loading}
            className="w-full h-12 text-base font-medium transition-all"
          >
            {loading ? "Please wait..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
