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

const BASE_URL = "http://localhost:5000";
const CURRENT_FACULTY_ID = "FAC101"; // temp

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

export default function TeacherDashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  // Notifications modal control
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Stats
  const [projectsCount, setProjectsCount] = useState(0);
  const [studentMatchesCount, setStudentMatchesCount] = useState(0);
  const [openingsCount, setOpeningsCount] = useState(0);

  const navItems = [
    { id: "home" as Page, icon: Home, label: "Dashboard", color: "text-primary" },
    { id: "profile" as Page, icon: UserPlus, label: "My Profile", color: "text-chart-3" },
    { id: "students" as Page, icon: Users, label: "Connect with Students", color: "text-chart-2" },
    { id: "projects" as Page, icon: FileText, label: "Projects", color: "text-chart-3" },
    { id: "openings" as Page, icon: Briefcase, label: "Project Openings", color: "text-chart-2" }
  ];

  // ---------- Load dashboard stats + unread notifications ----------
  useEffect(() => {
    const loadStats = async () => {
      try {
        // 1) Unread notifications count
        try {
          const notifRes = await fetch(
            `${BASE_URL}/api/notifications/teacher/${CURRENT_FACULTY_ID}`
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
            `${BASE_URL}/api/projects/teacher/${CURRENT_FACULTY_ID}`
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
            `${BASE_URL}/api/matchmaking/teacher/${CURRENT_FACULTY_ID}/students`
          );
          if (matchRes.ok) {
            const matchData = await safeJson(matchRes);
            const list = Array.isArray(matchData) ? matchData : [];
            setStudentMatchesCount(list.filter((m: any) => (m.match_score ?? 0) > 60).length);
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
            `${BASE_URL}/api/projects/openings/teacher/${CURRENT_FACULTY_ID}`
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

  const quickStats = useMemo(
    () => [
      {
        label: "Projects Posted",
        value: String(projectsCount),
        icon: FolderKanban,
        color: "bg-chart-3/10 text-chart-3",
        hover: "hover:bg-chart-3/20"
      },
      {
        label: "Student Matches > 60%",
        value: String(studentMatchesCount),
        icon: Users,
        color: "bg-secondary/10 text-secondary",
        hover: "hover:bg-secondary/20"
      },
      {
        label: "Project Openings",
        value: String(openingsCount),
        icon: Briefcase,
        color: "bg-accent/10 text-accent",
        hover: "hover:bg-accent/20"
      }
    ],
    [projectsCount, studentMatchesCount, openingsCount]
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">RVCE Hub</h1>
              <p className="text-sm text-sidebar-foreground/60">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg scale-[1.02]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:scale-[1.02] hover:shadow-md"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? item.color : "group-hover:scale-110"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive hover:scale-[1.02] transition-all duration-300"
            onClick={() => window.location.reload()}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 w-full overflow-y-auto">
        {currentPage === "home" && (
          <div className="p-8 space-y-6 w-full">
            {/* Top header row */}
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-4xl font-bold text-foreground">Welcome back 👋</h2>
                <p className="text-muted-foreground mt-2">
                  Manage mentorships, projects and student connections
                </p>
              </div>

              {/* Right side: Notifications + Active chip */}
              <div className="flex items-center gap-3">
                {/* 🔔 Big notifications icon on right */}
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-2xl w-12 h-12 shadow-sm"
                  onClick={() => setNotifOpen(true)}
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}
                </Button>

                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Active Mentor
                </div>
              </div>
            </div>

            {/* Notifications modal component (modal-only now) */}
            <Notifications
              recipientType="teacher"
              recipientId={CURRENT_FACULTY_ID}
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
                    className="border-2 hover:border-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${stat.color} ${stat.hover} transition-colors duration-300`}
                        >
                          <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Connect Students",
                  desc: "Find compatible students",
                  page: "students" as Page,
                  icon: Users,
                  color: "from-secondary to-secondary/60"
                },
                {
                  title: "Find Mentors",
                  desc: "Connect with colleagues",
                  page: "openings" as Page, // or create a new colleagues page later
                  icon: UserPlus,
                  color: "from-primary to-primary/60"
                },
                {
                  title: "Create Project Opening",
                  desc: "Post a new project",
                  page: "projects" as Page,
                  icon: FileText,
                  color: "from-chart-3 to-chart-3/60"
                },
                {
                  title: "View Projects",
                  desc: "Manage your projects",
                  page: "projects" as Page,
                  icon: FolderKanban,
                  color: "from-accent to-accent/60"
                }
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="border-2 hover:border-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
                    onClick={() => setCurrentPage(action.page)}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                    />
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {action.title}
                          </CardTitle>
                          <CardDescription>{action.desc}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Recent activity */}
            <Card className="border-2 hover:border-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "New Mentorship Request", subject: "AI Project", time: "1 hour ago" },
                    { action: "Project Updated", subject: "Hackathon Team", time: "1 day ago" }
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                    >
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.subject}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPage === "students" && <FindStudents />}
        {currentPage === "projects" && <TeacherProjects />}
        {currentPage === "openings" && <TeacherProjectOpenings />}
        {currentPage === "profile" && <TeacherProfile />}
      </main>
    </div>
  );
}
