"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Notifications from "@/components/notifications";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  FileText,
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  LogOut,
  Home,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  FolderKanban,
  Briefcase
} from "lucide-react";

import StudentProfile from "@/components/student-profile";
import AssessmentQuizzes from "@/components/assessment-quizzes";
import JoinClassroom from "@/components/join-classroom";
import FindTeammates from "@/components/find-teammates";
import FindMentors from "@/components/find-mentors";
import StudyHub from "@/components/study-hub";
import StudentProjects from "@/components/student-projects"; // ✅ make sure this file exists
import ProjectOpenings from "@/components/project-openings";

type Page =
  | "home"
  | "profile"
  | "quizzes"
  | "classroom"
  | "teammates"
  | "mentors"
  | "study"
  | "projects" // ✅ added projects
  | "openings";

export default function StudentDashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const navItems = [
    { id: "home" as Page, icon: Home, label: "Dashboard", color: "text-primary" },
    { id: "profile" as Page, icon: User, label: "Profile", color: "text-secondary" },
    { id: "quizzes" as Page, icon: FileText, label: "Assessment Quizzes", color: "text-accent" },
    { id: "classroom" as Page, icon: BookOpen, label: "Join Classroom", color: "text-chart-4" },
    { id: "teammates" as Page, icon: Users, label: "Find EL Teammates", color: "text-chart-2" },
    { id: "mentors" as Page, icon: UserPlus, label: "Find Mentors", color: "text-chart-3" },
    { id: "study" as Page, icon: GraduationCap, label: "Study Hub", color: "text-chart-5" },
    { id: "projects" as Page, icon: FolderKanban, label: "Projects", color: "text-chart-1" }, // ✅ sidebar item
    { id: "openings" as Page, icon: Briefcase, label: "Project Openings", color: "text-chart-1" },

  ];

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
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-foreground">Welcome back! 👋</h2>
                <p className="text-muted-foreground mt-2">
                  Here's what's happening with your learning journey
                </p>

                {/* ✅ Notifications should be inside the component */}
                <div className="mt-3">
                  <Notifications />
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium animate-pulse-subtle">
                <Sparkles className="w-4 h-4" />
                Active Student
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Current CGPA",
                  value: "8.5",
                  icon: Award,
                  color: "bg-primary/10 text-primary",
                  hover: "hover:bg-primary/20",
                },
                {
                  label: "Quizzes Pending",
                  value: "3",
                  icon: FileText,
                  color: "bg-accent/10 text-accent",
                  hover: "hover:bg-accent/20",
                },
                {
                  label: "Active Teams",
                  value: "2",
                  icon: Users,
                  color: "bg-secondary/10 text-secondary",
                  hover: "hover:bg-secondary/20",
                },
                {
                  label: "Match Score",
                  value: "85%",
                  icon: Target,
                  color: "bg-chart-2/10 text-chart-2",
                  hover: "hover:bg-chart-2/20",
                },
              ].map((stat, i) => {
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
                        <div className={`p-3 rounded-lg ${stat.color} ${stat.hover} transition-colors duration-300`}>
                          <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Take Quiz",
                  desc: "Complete pending assessments",
                  page: "quizzes" as Page,
                  icon: FileText,
                  color: "from-accent to-accent/60",
                },
                {
                  title: "Find Teammates",
                  desc: "Connect with compatible peers",
                  page: "teammates" as Page,
                  icon: Users,
                  color: "from-secondary to-secondary/60",
                },
                {
                  title: "Study Hub",
                  desc: "Upload & learn from documents",
                  page: "study" as Page,
                  icon: BookOpen,
                  color: "from-primary to-primary/60",
                },
                {
                  title: "Projects",
                  desc: "Find and manage your projects",
                  page: "projects" as Page,
                  icon: FolderKanban,
                  color: "from-chart-3 to-chart-3/60",
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.page}
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
                    {
                      action: "Completed Quiz",
                      subject: "Data Structures",
                      time: "2 hours ago",
                      color: "bg-success/10 text-success",
                    },
                    {
                      action: "Joined Classroom",
                      subject: "Algorithm Design",
                      time: "1 day ago",
                      color: "bg-primary/10 text-primary",
                    },
                    {
                      action: "Found Teammate",
                      subject: "Project Match (92%)",
                      time: "2 days ago",
                      color: "bg-secondary/10 text-secondary",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${activity.color} group-hover:scale-150 transition-transform duration-300`}
                        />
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.subject}</p>
                        </div>
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
        {currentPage === "quizzes" && <AssessmentQuizzes />}
        {currentPage === "classroom" && <JoinClassroom />}
        {currentPage === "teammates" && <FindTeammates />}
        {currentPage === "mentors" && <FindMentors />}
        {currentPage === "study" && <StudyHub />}
        {currentPage === "projects" && <StudentProjects />} {/* ✅ projects page */}
        {currentPage === "openings" && <ProjectOpenings />}

      </main>
    </div>
  );
}
