"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Eye, Award, Code, Rocket } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function StudentConnect() {
  const students = [
    {
      id: 1,
      name: "Arjun Sharma",
      matchScore: 94,
      usn: "1RV21CS015",
      branch: "CSE",
      year: "3rd Year",
      cgpa: 8.8,
      skills: ["React", "Node.js", "Python"],
      projects: 5,
      interests: ["Web Development", "AI/ML"],
    },
    {
      id: 2,
      name: "Priya Reddy",
      matchScore: 91,
      usn: "1RV21CS032",
      branch: "CSE",
      year: "3rd Year",
      cgpa: 9.1,
      skills: ["Java", "Spring Boot", "AWS"],
      projects: 7,
      interests: ["Cloud Computing", "Microservices"],
    },
    {
      id: 3,
      name: "Karthik Kumar",
      matchScore: 87,
      usn: "1RV21CS048",
      branch: "CSE",
      year: "3rd Year",
      cgpa: 8.5,
      skills: ["Flutter", "Firebase", "UI/UX"],
      projects: 4,
      interests: ["Mobile Development", "Design"],
    },
    {
      id: 4,
      name: "Sneha Patel",
      matchScore: 78,
      usn: "1RV21IS021",
      branch: "ISE",
      year: "3rd Year",
      cgpa: 8.3,
      skills: ["Python", "ML", "TensorFlow"],
      projects: 6,
      interests: ["Machine Learning", "Data Science"],
    },
    {
      id: 5,
      name: "Rohan Desai",
      matchScore: 65,
      usn: "1RV21CS067",
      branch: "CSE",
      year: "3rd Year",
      cgpa: 7.9,
      skills: ["C++", "DSA", "Competitive"],
      projects: 3,
      interests: ["Algorithms", "Problem Solving"],
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
            <Users className="w-8 h-8 text-primary" />
            Student Connect
          </h2>
          <p className="text-muted-foreground mt-1">Find students that match your mentorship preferences</p>
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
        {students.map((student) => {
          const colors = getMatchColor(student.matchScore)
          return (
            <Card
              key={student.id}
              className={`border-2 ${colors.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16 border-2 group-hover:scale-110 transition-transform duration-300">
                    <AvatarFallback className={`text-xl font-bold ${colors.bg} ${colors.text}`}>
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {student.usn} • {student.branch} • {student.year}
                        </p>
                      </div>

                      {/* Match Score Badge */}
                      <div
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${colors.bg} ${colors.text} border-2 ${colors.border} group-hover:scale-110 transition-all duration-300`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${colors.indicator} animate-pulse`} />
                          <span className="text-2xl font-bold">{student.matchScore}%</span>
                        </div>
                        <span className="text-xs font-medium">Match Score</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Award className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">CGPA</p>
                          <p className="font-bold">{student.cgpa}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Rocket className="w-4 h-4 text-accent" />
                        <div>
                          <p className="text-xs text-muted-foreground">Projects</p>
                          <p className="font-bold">{student.projects}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <Code className="w-4 h-4 text-secondary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Interests</p>
                          <p className="font-bold">{student.interests.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Skills & Interests */}
                    <div className="space-y-2 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {student.skills.map((skill, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.interests.map((interest, i) => (
                          <Badge
                            key={i}
                            className="bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 transition-all duration-300 cursor-pointer"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
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
