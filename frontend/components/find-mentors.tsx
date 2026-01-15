"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Mail, Eye, Award, BookOpen, Briefcase } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function FindMentors() {
  const mentors = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      matchScore: 95,
      department: "Computer Science",
      experience: "15 years",
      expertise: ["AI/ML", "Deep Learning", "Computer Vision"],
      projects: 25,
      publications: 18,
    },
    {
      id: 2,
      name: "Prof. Meera Nair",
      matchScore: 89,
      department: "Information Science",
      experience: "12 years",
      expertise: ["Cloud Computing", "DevOps", "Microservices"],
      projects: 20,
      publications: 12,
    },
    {
      id: 3,
      name: "Dr. Amit Patel",
      matchScore: 82,
      department: "Computer Science",
      experience: "10 years",
      expertise: ["Web Development", "Full Stack", "Node.js"],
      projects: 18,
      publications: 8,
    },
    {
      id: 4,
      name: "Prof. Sanjana Rao",
      matchScore: 75,
      department: "Data Science",
      experience: "8 years",
      expertise: ["Data Analytics", "Python", "Statistics"],
      projects: 15,
      publications: 10,
    },
    {
      id: 5,
      name: "Dr. Vikram Singh",
      matchScore: 68,
      department: "Software Engineering",
      experience: "11 years",
      expertise: ["System Design", "Architecture", "Java"],
      projects: 22,
      publications: 14,
    },
  ]

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return { bg: "bg-success/10", text: "text-success", border: "border-success/30", indicator: "bg-success" }
    if (score >= 60)
      return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", indicator: "bg-warning" }
    return {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/30",
      indicator: "bg-destructive",
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Find Mentors
          </h2>
          <p className="text-muted-foreground mt-1">Connect with faculty members who align with your interests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm">Strong (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm">Moderate (60-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm">Weak (0-59%)</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {mentors.map((mentor) => {
          const colors = getMatchColor(mentor.matchScore)
          return (
            <Card
              key={mentor.id}
              className={`border-2 ${colors.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16 border-2 group-hover:scale-110 transition-transform duration-300">
                    <AvatarFallback className={`text-xl font-bold ${colors.bg} ${colors.text}`}>
                      {mentor.name
                        .split(" ")
                        .slice(-2)
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{mentor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mentor.department} • {mentor.experience} experience
                        </p>
                      </div>

                      {/* Match Score Badge */}
                      <div
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${colors.bg} ${colors.text} border-2 ${colors.border} group-hover:scale-110 transition-all duration-300`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${colors.indicator} animate-pulse`} />
                          <span className="text-2xl font-bold">{mentor.matchScore}%</span>
                        </div>
                        <span className="text-xs font-medium">Match Score</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Experience</p>
                          <p className="font-bold">{mentor.experience}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Projects</p>
                          <p className="font-bold">{mentor.projects}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Award className="w-4 h-4 text-secondary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Publications</p>
                          <p className="font-bold">{mentor.publications}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expertise */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.expertise.map((skill, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 hover:bg-primary/10 hover:border-primary hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button className="flex-1 hover:scale-105 active:scale-95 transition-all duration-300">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact via Email
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
