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

import { API_BASE_URL } from "@/lib/utils";

const BASE_URL = API_BASE_URL;

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
    <div className="h-screen w-full bg-background overflow-hidden relative grid lg:grid-cols-12 p-4 lg:p-8 gap-8">

      {/* Background Decor Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Left side - Hero content */}
      <div className="col-span-12 lg:col-span-7 h-full flex flex-col justify-center min-h-0 space-y-8 pl-4 lg:pl-20 z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-widest animate-float border border-primary/10">
            <Sparkles className="w-4 h-4" />
            Welcome to EduConnect
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-[0.95]">
            Connect. <br /><span className="italic font-serif text-primary">Collaborate</span> <br />
            Build.
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed font-medium">
            Find teammates, connect with mentors, and explore projects. A professional platform built for your academic growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl pt-6">
          {/* Teams */}
          <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group border border-white/50">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">Teams</span>
          </div>

          {/* Mentors */}
          <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group border border-white/50">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">Mentors</span>
          </div>

          {/* Projects */}
          <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group border border-white/50">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
              <FolderKanban className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">Projects</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="col-span-12 lg:col-span-5 h-full flex flex-col justify-center min-h-0 z-20">
        <Card className="glass border-white/60 shadow-xl h-auto max-h-full overflow-y-auto">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-3xl font-bold text-foreground">
              {mode === "login" ? "Welcome Back" : "Join EduConnect"}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              {mode === "login"
                ? "Enter your credentials to access your dashboard"
                : "Create your account and start collaborating"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-xl">
              <Button
                type="button"
                variant="ghost"
                className={`flex-1 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setMode("login")}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={`flex-1 rounded-lg text-sm font-semibold transition-all ${mode === "signup" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </Button>
            </div>

            {/* User type selection */}
            <div className="space-y-3">
              <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">I am a</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setUserType("student")}
                  className={`cursor-pointer flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${userType === "student"
                    ? "border-primary bg-primary/5 text-primary scale-100 ring-2 ring-primary/20"
                    : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                >
                  <GraduationCap className={`w-8 h-8 ${userType === "student" ? "animate-pulse" : ""}`} />
                  <span className="font-semibold text-sm">Student</span>
                </div>

                <div
                  onClick={() => setUserType("teacher")}
                  className={`cursor-pointer flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${userType === "teacher"
                    ? "border-primary bg-primary/5 text-primary scale-100 ring-2 ring-primary/20"
                    : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                >
                  <BookOpen className={`w-8 h-8 ${userType === "teacher" ? "animate-pulse" : ""}`} />
                  <span className="font-semibold text-sm">Teacher</span>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {userType === "teacher" ? "Faculty ID" : "USN"}
                </Label>
                <Input
                  id="id"
                  type="text"
                  placeholder={userType === "teacher" ? "FAC101" : "1RVXXCS001"}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="h-12 rounded-xl bg-white/50 border-input focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-white/50 border-input focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Main button */}
            <Button
              className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
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
              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
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
        <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl glass">
          <DialogHeader>
            <DialogTitle className="text-primary font-bold text-xl">Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Password reset isn’t available yet. Please contact the <span className="font-semibold text-primary">Department Coordinator</span> to reset your credentials.
          </p>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setForgotOpen(false)} className="rounded-xl px-6">Okay</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
