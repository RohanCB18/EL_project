"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Notifications from "@/components/notifications";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  User,
  Users,
  UserPlus,
  GraduationCap,
  LogOut,
  Home,
  Sparkles,
  TrendingUp,
  FolderKanban,
  Briefcase,
  Bell
} from "lucide-react";

import StudentProfile from "@/components/student-profile";
import FindTeammates from "@/components/find-teammates";
import FindMentors from "@/components/find-mentors";
import StudentProjects from "@/components/student-projects";
import ProjectOpenings from "@/components/project-openings";

const BASE_URL = "http://localhost:5000";

type Page = "home" | "profile" | "teammates" | "mentors" | "projects" | "openings";

export default function StudentDashboard({
  usn,
  onLogout
}: {
  usn: string;
  onLogout: () => void;
}) {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  // ---- Dashboard Stats ----
  const [projectsPosted, setProjectsPosted] = useState<number>(0);
  const [studentMatches60, setStudentMatches60] = useState<number>(0);
  const [mentorMatches50, setMentorMatches50] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // ---- Notifications ----
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // ✅ Load unread notification status when dashboard loads
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/notifications/student/${usn}`);
        if (!res.ok) return;

        const data = await res.json();
        const unread = Array.isArray(data)
          ? data.some((n: any) => !n.is_read)
          : false;

        setHasUnreadNotifications(unread);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    if (usn) fetchUnread();
  }, [usn]);

  // ✅ Load stats when on Home
  useEffect(() => {
    if (currentPage !== "home") return;

    const loadStats = async () => {
      try {
        setStatsLoading(true);

        // 1) Projects posted by me
        const projRes = await fetch(`${BASE_URL}/api/projects/student/${usn}`);
        if (!projRes.ok) throw new Error("Failed to fetch projects");
        const projData = await projRes.json();
        setProjectsPosted(Array.isArray(projData) ? projData.length : 0);

        // 2) Student matches (> 60)
        const teamRes = await fetch(
          `${BASE_URL}/api/matchmaking/student/${usn}/students`
        );
        if (!teamRes.ok) throw new Error("Failed to fetch student matches");
        const teamData = await teamRes.json();
        const teamArr = Array.isArray(teamData) ? teamData : [];
        setStudentMatches60(
          teamArr.filter((m: any) => Number(m.match_score) >= 60).length
        );

        // 3) Mentor matches (> 50)
        const mentorRes = await fetch(
          `${BASE_URL}/api/matchmaking/student/${usn}/teachers`
        );
        if (!mentorRes.ok) throw new Error("Failed to fetch mentor matches");
        const mentorData = await mentorRes.json();
        const mentorArr = Array.isArray(mentorData) ? mentorData : [];
        setMentorMatches50(
          mentorArr.filter((m: any) => Number(m.match_score) >= 50).length
        );
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (usn) loadStats();
  }, [currentPage, usn]);

  const navItems = [
    { id: "home" as Page, icon: Home, label: "Dashboard", color: "text-primary" },
    { id: "profile" as Page, icon: User, label: "Profile", color: "text-secondary" },
    { id: "teammates" as Page, icon: Users, label: "Find EL Teammates", color: "text-chart-2" },
    { id: "mentors" as Page, icon: UserPlus, label: "Find Mentors", color: "text-chart-3" },
    { id: "projects" as Page, icon: FolderKanban, label: "Projects", color: "text-chart-1" },
    { id: "openings" as Page, icon: Briefcase, label: "Project Openings", color: "text-chart-1" }
  ];

  const quickActions = useMemo(
    () => [
      {
        title: "Find Teammates",
        desc: "Connect with students (60%+ match)",
        page: "teammates" as Page,
        icon: Users,
        color: "from-secondary to-secondary/60"
      },
      {
        title: "Find Mentors",
        desc: "Discover faculty mentors (50%+ match)",
        page: "mentors" as Page,
        icon: UserPlus,
        color: "from-primary to-primary/60"
      },
      {
        title: "Create Project Opening",
        desc: "Post your project requirements",
        page: "projects" as Page,
        icon: Briefcase,
        color: "from-chart-3 to-chart-3/60"
      },
      {
        title: "View Projects",
        desc: "Manage your posted projects",
        page: "projects" as Page,
        icon: FolderKanban,
        color: "from-chart-2 to-chart-2/60"
      }
    ],
    []
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Student Portal</p>
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

      {/* Main content */}
      <main className="col-span-12 lg:col-span-9 h-full flex flex-col min-h-0 overflow-y-auto rounded-[2.5rem] pr-2">
        {currentPage === "home" && (
          <div className="space-y-8 w-full pb-10">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-6 px-4 pt-2">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-black tracking-tight uppercase">Welcome back</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-green-600 text-[10px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active Student
                  </div>
                </div>
              </div>

              {/* ✅ ONLY ICON BUTTON */}
              <Button
                variant="ghost"
                size="icon"
                className="relative w-12 h-12 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="w-6 h-6 text-black" />
                {hasUnreadNotifications && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}
              </Button>

              {/* Notifications modal */}
              {notifOpen && (
                <Notifications
                  recipientType="student"
                  recipientId={usn}
                  open={notifOpen}
                  setOpen={(v: boolean) => {
                    setNotifOpen(v);

                    // ✅ when modal closes, refresh unread dot
                    if (!v) {
                      (async () => {
                        try {
                          const res = await fetch(
                            `${BASE_URL}/api/notifications/student/${usn}`
                          );
                          if (!res.ok) return;

                          const data = await res.json();
                          const unread = Array.isArray(data)
                            ? data.some((n: any) => !n.is_read)
                            : false;
                          setHasUnreadNotifications(unread);
                        } catch (err) {
                          console.error(err);
                        }
                      })();
                    }
                  }}
                />
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:translate-y-[-4px] transition-all duration-300 border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Projects Posted</p>
                      <p className="text-4xl font-black mt-2 text-black font-mono">
                        {statsLoading ? "…" : projectsPosted}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:translate-y-[-4px] transition-all duration-300 border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Student Matches</p>
                      <p className="text-4xl font-black mt-2 text-black font-mono">
                        {statsLoading ? "…" : studentMatches60}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:translate-y-[-4px] transition-all duration-300 border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Mentor Matches</p>
                      <p className="text-4xl font-black mt-2 text-black font-mono">
                        {statsLoading ? "…" : mentorMatches50}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-black text-white rounded-xl rotate-3 flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xl font-bold">Quick Access</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action) => {
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
            </div>

            {/* Recent Activity */}
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
                    {
                      action: "Matches refreshed",
                      subject: "New teammates/mentors available",
                      time: "Today"
                    },
                    {
                      action: "Project updated",
                      subject: "Your latest opening is live",
                      time: "Recently"
                    }
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

        {currentPage === "profile" && <StudentProfile usn={usn} />}
        {currentPage === "teammates" && <FindTeammates usn={usn} />}
        {currentPage === "mentors" && <FindMentors usn={usn} />}
        {currentPage === "projects" && <StudentProjects usn={usn} />}
        {currentPage === "openings" && <ProjectOpenings usn={usn} />}
      </main>
    </div>
  );
}
