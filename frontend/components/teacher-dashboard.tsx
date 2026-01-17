"use client";

import { useState } from "react";
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
  Bell,
  FileText,
  LogOut,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  UserPlus,
  Briefcase
} from "lucide-react";

import Notifications from "@/components/notifications";
import TeacherProjects from "@/components/teacher-projects";
import FindStudents from "@/components/find-students";
import TeacherProjectOpenings from "@/components/teacher-project-openings";

const CURRENT_FACULTY_ID = "FAC101"; // temp
type Page = "home" | "students" | "projects" | "openings";

export default function TeacherDashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const navItems = [
    { id: "home" as Page, icon: Home, label: "Dashboard", color: "text-primary" },
    { id: "students" as Page, icon: Users, label: "Connect with Students", color: "text-chart-2" },
    { id: "projects" as Page, icon: FileText, label: "Projects", color: "text-chart-3" },
    { id: "openings" as Page, icon: Briefcase, label: "Project Openings", color: "text-chart-2" }
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
      <main className="flex-1 overflow-y-auto">
        {currentPage === "home" && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-foreground">Welcome back 👋</h2>
                <p className="text-muted-foreground mt-2">
                  Manage mentorships, projects and student connections
                </p>

                {/* Notifications icon/list */}
                <div className="mt-4">
                  <Notifications recipientType="teacher" recipientId={CURRENT_FACULTY_ID} />
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium animate-pulse-subtle">
                <Sparkles className="w-4 h-4" />
                Active Mentor
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Active Projects",
                  value: "2",
                  icon: Target
                },
                {
                  label: "New Requests",
                  value: "5",
                  icon: Bell
                },
                {
                  label: "Student Matches",
                  value: "10",
                  icon: Users
                },
                {
                  label: "Mentorship Score",
                  value: "88%",
                  icon: Award
                }
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
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
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
                  title: "Connect Students",
                  desc: "Find compatible students",
                  page: "students" as Page,
                  icon: UserPlus,
                  color: "from-secondary to-secondary/60"
                },
                {
                  title: "Manage Projects",
                  desc: "Post & edit projects",
                  page: "projects" as Page,
                  icon: FileText,
                  color: "from-primary to-primary/60"
                },
                {
                  title: "Project Openings",
                  desc: "Find colleagues & student openings",
                  page: "openings" as Page,
                  icon: Briefcase,
                  color: "from-accent to-accent/60"
                }
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
      </main>
    </div>
  );
}
