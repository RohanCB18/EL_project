"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  Home,
  Users,
  LogOut,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  UserPlus,
  Briefcase,
  FileText,
  Bell,
  FolderKanban
} from "lucide-react";

import Notifications from "@/components/notifications";
import TeacherProfile from "@/components/teacher-profile";
import TeacherProjects from "@/components/teacher-projects";
import FindStudents from "@/components/find-students";
import TeacherProjectOpenings from "@/components/teacher-project-openings";

import { API_BASE_URL } from "@/lib/utils";
const BASE_URL = API_BASE_URL;

type Page = "home" | "students" | "projects" | "openings" | "profile";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("❌ Non-JSON response:", text);
    throw new Error("Server returned non-JSON response");
  }
}

export default function TeacherDashboard({
  facultyId,
  onLogout
}: {
  facultyId: string;
  onLogout: () => void;
}) {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  // Notifications modal control
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Stats
  const [projectsCount, setProjectsCount] = useState(0);
  const [studentMatchesCount, setStudentMatchesCount] = useState(0);
  const [openingsCount, setOpeningsCount] = useState(0);



  // ---------- Load dashboard stats + unread notifications ----------
  useEffect(() => {
    const loadStats = async () => {
      try {
        // 1) Unread notifications count
        try {
          const notifRes = await fetch(
            `${BASE_URL}/api/notifications/teacher/${facultyId}`
          );
          if (notifRes.ok) {
            const notifData = await safeJson(notifRes);
            const list = Array.isArray(notifData) ? notifData : [];
            setUnreadNotifCount(list.filter((n: any) => !n.is_read).length);
          } else {
            setUnreadNotifCount(0);
          }
        } catch (e) {
          console.error("Unread notif fetch failed:", e);
          setUnreadNotifCount(0);
        }

        // 2) Projects posted by teacher
        try {
          const projRes = await fetch(
            `${BASE_URL}/api/projects/teacher/${facultyId}`
          );
          if (projRes.ok) {
            const projData = await safeJson(projRes);
            setProjectsCount(Array.isArray(projData) ? projData.length : 0);
          } else {
            setProjectsCount(0);
          }
        } catch (e) {
          console.error("Teacher projects count fetch failed:", e);
          setProjectsCount(0);
        }

        // 3) Student matches > 60%
        // (Assumes your existing route is working for teachers)
        try {
          const matchRes = await fetch(
            `${BASE_URL}/api/matchmaking/teacher/${facultyId}/students`
          );
          if (matchRes.ok) {
            const matchData = await safeJson(matchRes);
            const list = Array.isArray(matchData) ? matchData : [];
            setStudentMatchesCount(
              list.filter((m: any) => (m.match_score ?? 0) > 60).length
            );
          } else {
            setStudentMatchesCount(0);
          }
        } catch (e) {
          console.error("Teacher-student matches fetch failed:", e);
          setStudentMatchesCount(0);
        }

        // 4) Project openings count for teacher view:
        // colleagueProjects + studentOpenings
        try {
          const openRes = await fetch(
            `${BASE_URL}/api/projects/openings/teacher/${facultyId}`
          );
          if (openRes.ok) {
            const openData = await safeJson(openRes);
            const colleague = Array.isArray(openData?.colleagueProjects)
              ? openData.colleagueProjects.length
              : 0;
            const students = Array.isArray(openData?.studentOpenings)
              ? openData.studentOpenings.length
              : 0;
            setOpeningsCount(colleague + students);
          } else {
            setOpeningsCount(0);
          }
        } catch (e) {
          console.error("Teacher openings count fetch failed:", e);
          setOpeningsCount(0);
        }
      } catch (err) {
        console.error("Teacher dashboard stats load failed:", err);
      }
    };

    if (currentPage === "home") loadStats();
  }, [currentPage]);

  const navItems = [
    { id: "home" as Page, icon: Home, label: "Dashboard" },
    { id: "profile" as Page, icon: UserPlus, label: "My Profile" },
    { id: "students" as Page, icon: Users, label: "Connect with Students" },
    { id: "projects" as Page, icon: FileText, label: "Projects" },
    { id: "openings" as Page, icon: Briefcase, label: "Project Openings" }
  ];

  const quickStats = useMemo(
    () => [
      {
        label: "Projects Posted",
        value: String(projectsCount),
        icon: FolderKanban,
      },
      {
        label: "Student Matches > 60%",
        value: String(studentMatchesCount),
        icon: Users,
      },
      {
        label: "Project Openings",
        value: String(openingsCount),
        icon: Briefcase,
      }
    ],
    [projectsCount, studentMatchesCount, openingsCount]
  );

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative grid lg:grid-cols-12 p-4 lg:p-6 gap-6">

      {/* Background Decor Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="col-span-12 lg:col-span-3 glass h-full rounded-2xl flex flex-col overflow-hidden relative z-20 border border-white/50 shadow-lg">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm text-primary">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">RVCE Hub</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${isActive ? "text-primary scale-110" : "group-hover:scale-110"
                    }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl py-6"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wide text-xs">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="col-span-12 lg:col-span-9 h-full flex flex-col min-h-0 overflow-y-auto rounded-2xl pr-2 z-10 scrollbar-hide">
        {currentPage === "home" && (
          <div className="space-y-6 w-full pb-10">
            {/* Top header row */}
            <div className="flex items-start justify-between gap-6 pt-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome back</h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Manage mentorships & projects
                </p>
              </div>

              {/* Right side: Notifications + Active chip */}
              <div className="flex items-center gap-3">
                {/* 🔔 Big notifications icon on right */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-12 h-12 rounded-xl bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all border border-white/50"
                  onClick={() => setNotifOpen(true)}
                >
                  <Bell className="w-6 h-6 text-foreground" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full shadow-sm ring-2 ring-white" />
                  )}
                </Button>

                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-green-600 text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Active Mentor
                </div>
              </div>
            </div>

            {/* Notifications modal component (modal-only now) */}
            <Notifications
              recipientType="teacher"
              recipientId={facultyId}
              open={notifOpen}
              setOpen={setNotifOpen}
            />

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={i}
                    className="hover:-translate-y-1 transition-all duration-300 border border-white/50 glass shadow-md"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                          <p className="text-4xl font-bold mt-2 text-foreground font-sans">{stat.value}</p>
                        </div>
                        <div
                          className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Connect Students",
                  desc: "Find compatible students",
                  page: "students" as Page,
                  icon: Users,
                },
                {
                  title: "Find Mentors",
                  desc: "Connect with colleagues",
                  page: "openings" as Page,
                  icon: UserPlus,
                },
                {
                  title: "Create Project Opening",
                  desc: "Post a new project",
                  page: "projects" as Page,
                  icon: FileText,
                },
                {
                  title: "View Projects",
                  desc: "Manage your projects",
                  page: "projects" as Page,
                  icon: FolderKanban,
                }
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="cursor-pointer group relative overflow-hidden glass border border-white/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    onClick={() => setCurrentPage(action.page)}
                  >
                    <CardHeader className="space-y-4 p-5">
                      <div className="w-12 h-12 bg-secondary/50 text-foreground rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="font-bold text-base leading-tight text-foreground">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{action.desc}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Recent activity */}
            <Card className="border-0 glass shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { action: "New Mentorship Request", subject: "AI Project", time: "1 hour ago" },
                    { action: "Project Updated", subject: "Hackathon Team", time: "1 day ago" }
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all cursor-pointer group border border-transparent hover:border-white/50"
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{activity.action}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{activity.subject}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SAME STYLE AS STUDENT DASHBOARD */}
        {currentPage === "students" && <FindStudents facultyId={facultyId} />}
        {currentPage === "projects" && <TeacherProjects facultyId={facultyId} />}
        {currentPage === "openings" && <TeacherProjectOpenings facultyId={facultyId} />}
        {currentPage === "profile" && <TeacherProfile facultyId={facultyId} />}
      </main>
    </div>
  );
}
