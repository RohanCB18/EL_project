"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Notifications from "@/components/notifications";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
const CURRENT_USN = "1RV15CS001";

type Page = "home" | "profile" | "teammates" | "mentors" | "projects" | "openings";

export default function StudentDashboard() {
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
        const res = await fetch(
          `${BASE_URL}/api/notifications/student/${CURRENT_USN}`
        );
        if (!res.ok) return;

        const data = await res.json();
        const unread = Array.isArray(data) ? data.some((n: any) => !n.is_read) : false;
        setHasUnreadNotifications(unread);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchUnread();
  }, []);

  // ✅ Load stats when on Home
  useEffect(() => {
    if (currentPage !== "home") return;

    const loadStats = async () => {
      try {
        setStatsLoading(true);

        // 1) Projects posted by me
        const projRes = await fetch(`${BASE_URL}/api/projects/student/${CURRENT_USN}`);
        if (!projRes.ok) throw new Error("Failed to fetch projects");
        const projData = await projRes.json();
        setProjectsPosted(Array.isArray(projData) ? projData.length : 0);

        // 2) Student matches (> 60)
        const teamRes = await fetch(
          `${BASE_URL}/api/matchmaking/student/${CURRENT_USN}/students`
        );
        if (!teamRes.ok) throw new Error("Failed to fetch student matches");
        const teamData = await teamRes.json();
        const teamArr = Array.isArray(teamData) ? teamData : [];
        setStudentMatches60(teamArr.filter((m: any) => Number(m.match_score) >= 60).length);

        // 3) Mentor matches (> 50)
        const mentorRes = await fetch(
          `${BASE_URL}/api/matchmaking/student/${CURRENT_USN}/teachers`
        );
        if (!mentorRes.ok) throw new Error("Failed to fetch mentor matches");
        const mentorData = await mentorRes.json();
        const mentorArr = Array.isArray(mentorData) ? mentorData : [];
        setMentorMatches50(mentorArr.filter((m: any) => Number(m.match_score) >= 50).length);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [currentPage]);

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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">RVCE Hub</h1>
              <p className="text-sm text-sidebar-foreground/60">Student Portal</p>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {currentPage === "home" && (
          <div className="p-8 space-y-8 w-full">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-foreground">Welcome back 👋</h2>
                <p className="text-muted-foreground">
                  Manage your profile, projects and connections
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium animate-pulse-subtle">
                    <Sparkles className="w-4 h-4" />
                    Active Student
                  </div>
                </div>
              </div>


              {/* ✅ ONLY ICON BUTTON */}
              <Button
                variant="ghost"
                size="icon"
                className="relative w-12 h-12 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="w-6 h-6" />
                {hasUnreadNotifications && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </Button>


              {/* Notifications modal */}
              {notifOpen && (
                <Notifications
                  recipientType="student"
                  recipientId={CURRENT_USN}
                  open={notifOpen}
                  setOpen={(v: boolean) => {
                    setNotifOpen(v);

                    // ✅ when modal closes, refresh unread dot
                    if (!v) {
                      (async () => {
                        try {
                          const res = await fetch(
                            `${BASE_URL}/api/notifications/student/${CURRENT_USN}`
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
              <Card className="border-2 hover:border-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Projects Posted</p>
                      <p className="text-3xl font-bold mt-2">
                        {statsLoading ? "…" : projectsPosted}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your posted projects
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-chart-3/10 text-chart-3">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Student Matches</p>
                      <p className="text-3xl font-bold mt-2">
                        {statsLoading ? "…" : studentMatches60}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Match score ≥ 60
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mentor Matches</p>
                      <p className="text-3xl font-bold mt-2">
                        {statsLoading ? "…" : mentorMatches50}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Match score ≥ 50
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <UserPlus className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">Quick Access</h3>
                <p className="text-sm text-muted-foreground">
                  Find teammates, mentors and projects instantly
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.title}
                      className="border-2 hover:border-primary/30 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer group overflow-hidden relative"
                      onClick={() => setCurrentPage(action.page)}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                      />
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
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
            </div>

            {/* Recent Activity */}
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

        {currentPage === "profile" && <StudentProfile />}
        {currentPage === "teammates" && <FindTeammates />}
        {currentPage === "mentors" && <FindMentors />}
        {currentPage === "projects" && <StudentProjects />}
        {currentPage === "openings" && <ProjectOpenings />}
      </main>
    </div>
  );
}
