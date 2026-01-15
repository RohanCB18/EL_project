"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, User, Mail, Building, Award, BookOpen, Clock } from "lucide-react"

export default function TeacherProfile() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1500)
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Teacher Profile
          </h2>
          <p className="text-muted-foreground mt-1">Complete your profile for better student matching</p>
        </div>
        <Button
          size="lg"
          onClick={handleSave}
          className="shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
          disabled={isSaving}
        >
          <Save className={`w-5 h-5 mr-2 ${isSaving ? "animate-spin" : ""}`} />
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card className="border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Dr. John Doe"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">RVCE Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@rvce.edu.in"
                  className="pl-10 transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="department"
                  placeholder="Computer Science"
                  className="pl-10 transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="10"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Expertise */}
        <Card className="border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-secondary" />
              Expertise & Research
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expertise">Areas of Expertise</Label>
              <Input
                id="expertise"
                placeholder="AI, Machine Learning, Deep Learning"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentor-domains">Domains Interested to Mentor</Label>
              <Input
                id="mentor-domains"
                placeholder="Web Development, Mobile Apps, IoT"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publications">Prominent Projects or Publications</Label>
              <Textarea
                id="publications"
                placeholder="Describe your notable research and publications..."
                className="min-h-24 transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pub-count">Publication Count</Label>
              <Input
                id="pub-count"
                type="number"
                placeholder="15"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mentoring Preferences */}
        <Card className="border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Mentoring Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-domains">Preferred Project Domains</Label>
              <Input
                id="project-domains"
                placeholder="AI, Web, Mobile"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-types">Preferred Project Types</Label>
              <Select>
                <SelectTrigger className="transition-all duration-300 hover:border-primary/50 focus:scale-[1.01] focus:shadow-md">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentoring-style">Mentoring Style</Label>
              <Select>
                <SelectTrigger className="transition-all duration-300 hover:border-primary/50 focus:scale-[1.01] focus:shadow-md">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hands-on">Hands-on</SelectItem>
                  <SelectItem value="guidance">Guidance</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-level">Preferred Level of Student Team</Label>
              <Select>
                <SelectTrigger className="transition-all duration-300 hover:border-primary/50 focus:scale-[1.01] focus:shadow-md">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="any">Any Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="border-2 hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-chart-4" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-hours">Weekly Availability Hours</Label>
              <Input
                id="weekly-hours"
                type="number"
                placeholder="10"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-projects">Max Parallel Projects</Label>
              <Input
                id="max-projects"
                type="number"
                placeholder="3"
                className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
