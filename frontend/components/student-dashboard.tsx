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

import { API_BASE_URL } from "@/lib/utils";
const BASE_URL = API_BASE_URL;

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
    { id: "home" as Page, icon: Home, label: "Dashboard" },
    { id: "profile" as Page, icon: User, label: "Profile" },
    { id: "teammates" as Page, icon: Users, label: "Find EL Teammates" },
    { id: "mentors" as Page, icon: UserPlus, label: "Find Mentors" },
    { id: "projects" as Page, icon: FolderKanban, label: "Projects" },
    { id: "openings" as Page, icon: Briefcase, label: "Project Openings" }
  ];

  const quickActions = useMemo(
    () => [
      {
        title: "Find Teammates",
        desc: "Connect with students (60%+ match)",
        page: "teammates" as Page,
        icon: Users,
      },
      {
        title: "Find Mentors",
        desc: "Discover faculty mentors (50%+ match)",
        page: "mentors" as Page,
        icon: UserPlus,
      },
      {
        title: "Create Project Opening",
        desc: "Post your project requirements",
        page: "projects" as Page,
        icon: Briefcase,
      },
      {
        title: "View Projects",
        desc: "Manage your posted projects",
        page: "projects" as Page,
        icon: FolderKanban,
      }
    ],
    []
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student Portal</p>
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

      {/* Main content */}
      <main className="col-span-12 lg:col-span-9 h-full flex flex-col min-h-0 overflow-y-auto rounded-2xl pr-2 z-10 scrollbar-hide">
        {currentPage === "home" && (
          <div className="space-y-6 w-full pb-10">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-6 pt-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome back</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-green-600 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active Student
                  </div>
                </div>
              </div>

              {/* ONLY ICON BUTTON */}
              <Button
                variant="ghost"
                size="icon"
                className="relative w-12 h-12 rounded-xl bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all border border-white/50"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="w-6 h-6 text-foreground" />
                {hasUnreadNotifications && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full shadow-sm ring-2 ring-white" />
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
              <Card className="hover:-translate-y-1 transition-all duration-300 border border-white/50 glass shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projects Posted</p>
                      <p className="text-4xl font-bold mt-2 text-foreground font-sans">
                        {statsLoading ? "…" : projectsPosted}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:-translate-y-1 transition-all duration-300 border border-white/50 glass shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student Matches</p>
                      <p className="text-4xl font-bold mt-2 text-foreground font-sans">
                        {statsLoading ? "…" : studentMatches60}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:-translate-y-1 transition-all duration-300 border border-white/50 glass shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mentor Matches</p>
                      <p className="text-4xl font-bold mt-2 text-foreground font-sans">
                        {statsLoading ? "…" : mentorMatches50}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <UserPlus className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-foreground">Quick Access</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
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
            </div>

            {/* Recent Activity */}
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

        {currentPage === "profile" && <StudentProfile usn={usn} />}
        {currentPage === "teammates" && <FindTeammates usn={usn} />}
        {currentPage === "mentors" && <FindMentors usn={usn} />}
        {currentPage === "projects" && <StudentProjects usn={usn} />}
        {currentPage === "openings" && <ProjectOpenings usn={usn} />}
      </main>
    </div>
  );
}
