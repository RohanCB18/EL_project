"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

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
        const res = await fetch(
          `${BACKEND_URL}/classrooms/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!res.ok) return

        const data = await res.json()

        if (data.classroom_id) {
          router.replace("/teacher/dashboard")
        }
      } catch {
        // silent — do not block UI
      }
    }

    checkStatus()
  }, [router, token])

  const handleCreateClass = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${BACKEND_URL}/classrooms/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            room_name: className,
            password: classPassword,
          }),
        }
      )

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-8">
      <h1 className="text-3xl font-bold text-foreground animate-float text-center">
        Welcome to Kaksha Saathi
      </h1>

      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Create Your Classroom
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Enter class name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classPassword">Class Password</Label>
            <Input
              id="classPassword"
              type="password"
              value={classPassword}
              onChange={(e) => setClassPassword(e.target.value)}
              placeholder="Enter class password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
              {error}
            </p>
          )}

          <Button
            onClick={handleCreateClass}
            disabled={loading}
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Creating..." : "Create Class"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
