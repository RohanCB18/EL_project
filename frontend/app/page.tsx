"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Users,
  Sparkles,
  FolderKanban,
  UserPlus,
  BookOpen
} from "lucide-react";

import StudentDashboard from "@/components/student-dashboard";
import TeacherDashboard from "@/components/teacher-dashboard";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const BASE_URL = "http://localhost:5000";

export default function Home() {
  const [userType, setUserType] = useState<"student" | "teacher" | null>(null);

  const [id, setId] = useState(""); // USN / Faculty ID
  const [password, setPassword] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Forgot password popup
  const [forgotOpen, setForgotOpen] = useState(false);

  // NEW: login/signup toggle
  const [mode, setMode] = useState<"login" | "signup">("login");

  // NEW: loading state
  const [loading, setLoading] = useState(false);

  // ✅ Auto-login if session exists
  useEffect(() => {
    const savedType = localStorage.getItem("userType") as
      | "student"
      | "teacher"
      | null;
    const savedId = localStorage.getItem("userId");

    if (savedType && savedId) {
      setUserType(savedType);
      setId(savedId);
      setIsLoggedIn(true);
    }
  }, []);

  // ---------------- AUTH HELPERS ----------------
  const handleLogin = async () => {
    if (!id || !password || !userType) return;

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_type: userType,
          user_id: id,
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Login failed");
        return;
      }

      // ✅ Save session
      localStorage.setItem("userType", userType);
      localStorage.setItem("userId", id);

      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      alert("Server not reachable. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!id || !password || !userType) return;

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_type: userType,
          user_id: id,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Signup failed");
        return;
      }

      alert("Account created! Now sign in.");

      // switch to login mode after signup
      setMode("login");
      setPassword("");
    } catch (err) {
      console.error(err);
      alert("Server not reachable. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // clear session
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");

    // reset state
    setIsLoggedIn(false);
    setUserType(null);
    setId("");
    setPassword("");
    setMode("login");
  };


  // ---------------- DASHBOARD ROUTING ----------------
  if (isLoggedIn && userType === "student") {
    return <StudentDashboard usn={id} onLogout={handleLogout} />;
  }

  if (isLoggedIn && userType === "teacher") {
    return <TeacherDashboard facultyId={id} onLogout={handleLogout} />;
  }


  return (
    <div className="h-screen w-full bg-[#F4F4F7] overflow-hidden grid lg:grid-cols-12 p-8 gap-8">
      {/* Left side - Hero content */}
      <div className="col-span-12 lg:col-span-7 h-full flex flex-col justify-center min-h-0 space-y-8 pl-12 lg:pl-32">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-black text-[10px] font-black uppercase tracking-widest opacity-80 shadow-sm animate-float">
            <Sparkles className="w-4 h-4" />
            Welcome to EduConnect
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-black tracking-tighter leading-[0.9] uppercase">
            Connect.<br />Collaborate.<br />Build.
          </h1>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 max-w-lg leading-relaxed">
            Find teammates, connect with mentors, and explore projects — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8">
          {/* Teams */}
          <div className="flex flex-col gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wide opacity-50 group-hover:opacity-100 transition-opacity">Teams</span>
          </div>

          {/* Mentors */}
          <div className="flex flex-col gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wide opacity-50 group-hover:opacity-100 transition-opacity">Mentors</span>
          </div>

          {/* Projects */}
          <div className="flex flex-col gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wide opacity-50 group-hover:opacity-100 transition-opacity">Projects</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="col-span-12 lg:col-span-5 h-full flex flex-col justify-center min-h-0">
        <Card className="h-auto max-h-full overflow-y-auto shadow-2xl bg-white border-0 p-2">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-4xl font-bold text-center">
              {mode === "login" ? "Sign In" : "Join Us"}
            </CardTitle>
            <CardDescription className="text-center text-[10px] font-black uppercase tracking-widest opacity-40">
              {mode === "login"
                ? "Choose your role & enter credentials"
                : "Create your new account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* NEW: mode switch */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "ghost"}
                className={`flex-1 rounded-xl ${mode === "login" ? "bg-white text-black shadow-md" : "text-gray-500 hover:bg-gray-200"}`}
                onClick={() => setMode("login")}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "ghost"}
                className={`flex-1 rounded-xl ${mode === "signup" ? "bg-white text-black shadow-md" : "text-gray-500 hover:bg-gray-200"}`}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </Button>
            </div>

            {/* User type selection */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">I am a</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={userType === "student" ? "default" : "outline"}
                  className={`h-auto py-6 flex flex-col gap-3 transition-all duration-300 rounded-3xl border-0 ${userType === "student"
                    ? "bg-black text-white shadow-xl scale-105"
                    : "bg-white text-gray-400 hover:bg-gray-50 hover:text-black shadow-sm"
                    }`}
                  onClick={() => setUserType("student")}
                >
                  <GraduationCap
                    className={`w-8 h-8 ${userType === "student" ? "animate-bounce" : ""}`}
                  />
                  <span className="font-bold">Student</span>
                </Button>

                <Button
                  type="button"
                  variant={userType === "teacher" ? "default" : "outline"}
                  className={`h-auto py-6 flex flex-col gap-3 transition-all duration-300 rounded-3xl border-0 ${userType === "teacher"
                    ? "bg-black text-white shadow-xl scale-105"
                    : "bg-white text-gray-400 hover:bg-gray-50 hover:text-black shadow-sm"
                    }`}
                  onClick={() => setUserType("teacher")}
                >
                  <BookOpen
                    className={`w-8 h-8 ${userType === "teacher" ? "animate-bounce" : ""}`}
                  />
                  <span className="font-bold">Teacher</span>
                </Button>
              </div>
            </div>

            {/* USN / Faculty ID */}
            <div className="space-y-2">
              <Label htmlFor="id" className="text-[10px] font-black uppercase tracking-widest opacity-40">
                {userType === "teacher" ? "Faculty ID" : "USN"}
              </Label>
              <Input
                id="id"
                type="text"
                placeholder={userType === "teacher" ? "FAC101" : "1RVXXCS001"}
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-black/5"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest opacity-40">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-black/5"
              />
            </div>

            {/* Main button */}
            <Button
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:translate-y-[-2px] bg-black text-white"
              onClick={mode === "login" ? handleLogin : handleSignup}
              disabled={!userType || !id || !password || loading}
            >
              {loading
                ? "Processing..."
                : mode === "login"
                  ? "Enter Portal"
                  : "Create Account"}
            </Button>

            {/* Forgot password */}
            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forgot password modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Password reset isn’t available yet. Please contact the admin / department
            coordinator to reset your password.
          </p>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setForgotOpen(false)} className="rounded-xl">Okay</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
