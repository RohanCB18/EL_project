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
    <div className="h-screen w-full bg-[#F4F4F7] overflow-hidden grid lg:grid-cols-12 p-8 gap-8">
      {/* Sidebar */}
      <aside className="col-span-12 lg:col-span-3 bg-white h-full rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden relative z-20">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-all">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-black">RVCE Hub</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Teacher Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300 group ${isActive
                  ? "bg-black text-white shadow-lg translate-x-2"
                  : "text-gray-400 hover:bg-gray-100 hover:text-black hover:translate-x-1"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-white" : "group-hover:scale-110"
                    }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl py-6"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wide">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="col-span-12 lg:col-span-9 h-full flex flex-col min-h-0 overflow-y-auto rounded-[2.5rem] pr-2">
        {currentPage === "home" && (
          <div className="space-y-6 w-full pb-10">
            {/* Top header row */}
            <div className="flex items-start justify-between gap-6 px-4 pt-2">
              <div>
                <h2 className="text-4xl font-black text-black tracking-tight uppercase">Welcome back</h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Manage mentorships & projects
                </p>
              </div>

              {/* Right side: Notifications + Active chip */}
              <div className="flex items-center gap-3">
                {/* 🔔 Big notifications icon on right */}
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-2xl w-12 h-12 shadow-sm border-0 bg-white hover:shadow-md"
                  onClick={() => setNotifOpen(true)}
                >
                  <Bell className="w-6 h-6 text-black" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}
                </Button>

                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-green-600 text-[10px] font-black uppercase tracking-widest">
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
                    className="hover:translate-y-[-4px] transition-all duration-300 border-0 bg-white"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{stat.label}</p>
                          <p className="text-4xl font-black mt-2 text-black font-mono">{stat.value}</p>
                        </div>
                        <div
                          className={`w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center`}
                        >
                          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
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
                    className="cursor-pointer group relative overflow-hidden bg-white border-0 hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300"
                    onClick={() => setCurrentPage(action.page)}
                  >
                    <CardHeader className="space-y-4">
                      <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="font-bold text-lg leading-tight">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-2">{action.desc}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Recent activity */}
            <Card className="border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5" />
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
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F4F7] hover:bg-gray-100 transition-all cursor-pointer group"
                    >
                      <div>
                        <p className="font-bold text-sm">{activity.action}</p>
                        <p className="text-[10px] uppercase tracking-wide opacity-50">{activity.subject}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{activity.time}</span>
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
