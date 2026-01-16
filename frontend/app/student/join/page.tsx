"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome to Kaksha Saathi
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Join your classroom
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {infoMessage && (
            <p className="text-sm text-primary text-center">
              {infoMessage}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="classCode">Class Code</Label>
            <Input
              id="classCode"
              placeholder="Enter class code"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classPassword">Class Password</Label>
            <Input
              id="classPassword"
              type="password"
              placeholder="Enter class password"
              value={classPassword}
              onChange={(e) => setClassPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          <Button
            onClick={handleJoinClass}
            disabled={loading || !classCode || !classPassword}
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? "Joining..." : "Join Class"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
