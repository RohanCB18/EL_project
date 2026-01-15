"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, User, Building, Code, Rocket, Eye } from "lucide-react";
import { upsertStudentProfile } from "@/lib/student";

export default function StudentProfile() {
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<any>({
    name: "",
    usn: "",
    rvce_email: "",
    branch: "",
    year: "",
    section: "",
    cgpa: "",
    average_el_marks: "",
    gender: "",
    residence: "",
    programming_languages: [],
    tech_skills: [],
    domain_interests: [],
    past_projects: "",
    hackathon_participation_count: 0,
    hackathon_achievement_level: "",
    project_completion_approach: "",
    commitment_preference: "",
    is_visible_for_matching: true // ⭐ DEFAULT ON
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await upsertStudentProfile(profile);
      alert("Profile saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          Student Profile
        </h2>

        <div className="flex items-center gap-6">
          {/* VISIBILITY TOGGLE */}
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Profile Visibility
              </span>
              <span className="text-xs text-muted-foreground">
                Allow others to match with you
              </span>
            </div>
            <Switch
              checked={profile.is_visible_for_matching}
              onCheckedChange={(v) =>
                setProfile({ ...profile, is_visible_for_matching: v })
              }
            />
          </div>

          {/* SAVE BUTTON */}
          <Button size="lg" onClick={handleSave} disabled={isSaving}>
            <Save className={`w-5 h-5 mr-2 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>

      {/* PERSONAL INFO */}
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Full Name"
            onChange={e => setProfile({ ...profile, name: e.target.value })} />
          <Input placeholder="USN"
            onChange={e => setProfile({ ...profile, usn: e.target.value })} />
          <Input placeholder="RVCE Email"
            onChange={e => setProfile({ ...profile, rvce_email: e.target.value })} />

          <Select value={profile.gender}
            onValueChange={v => setProfile({ ...profile, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ACADEMIC INFO */}
      <Card>
        <CardHeader><CardTitle>Academic Information</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <Select value={profile.branch}
            onValueChange={v => setProfile({ ...profile, branch: v })}>
            <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CSE">CSE</SelectItem>
              <SelectItem value="ISE">ISE</SelectItem>
              <SelectItem value="ECE">ECE</SelectItem>
              <SelectItem value="ME">ME</SelectItem>
              <SelectItem value="CIVIL">CIVIL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={profile.year}
            onValueChange={v => setProfile({ ...profile, year: v })}>
            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Section"
            onChange={e => setProfile({ ...profile, section: e.target.value })} />
          <Input type="number" placeholder="CGPA"
            onChange={e => setProfile({ ...profile, cgpa: e.target.value })} />
          <Input type="number" placeholder="Average EL Marks"
            onChange={e => setProfile({ ...profile, average_el_marks: e.target.value })} />

          <Select value={profile.residence}
            onValueChange={v => setProfile({ ...profile, residence: v })}>
            <SelectTrigger><SelectValue placeholder="Residence" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hostellite">Hostel</SelectItem>
              <SelectItem value="pg">PG</SelectItem>
              <SelectItem value="day_scholar">Day Scholar</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* TECHNICAL SKILLS */}
      <Card>
        <CardHeader><CardTitle>Technical Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Programming Languages (comma separated)"
            onChange={e => setProfile({
              ...profile,
              programming_languages: e.target.value.split(",").map(s => s.trim())
            })} />
          <Input placeholder="Tech Skills (comma separated)"
            onChange={e => setProfile({
              ...profile,
              tech_skills: e.target.value.split(",").map(s => s.trim())
            })} />
          <Input placeholder="Domain Interests (comma separated)"
            onChange={e => setProfile({
              ...profile,
              domain_interests: e.target.value.split(",").map(s => s.trim())
            })} />
        </CardContent>
      </Card>

      {/* PROJECTS & MATCHING PREFERENCES */}
      <Card>
        <CardHeader><CardTitle>Projects & Matching Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Describe past projects"
            onChange={e => setProfile({ ...profile, past_projects: e.target.value })} />

          <Input type="number" placeholder="Hackathon count"
            onChange={e => setProfile({
              ...profile,
              hackathon_participation_count: Number(e.target.value)
            })} />

          <Select value={profile.hackathon_achievement_level}
            onValueChange={v => setProfile({ ...profile, hackathon_achievement_level: v })}>
            <SelectTrigger><SelectValue placeholder="Achievement Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="participant">Participant</SelectItem>
              <SelectItem value="finalist">Finalist</SelectItem>
              <SelectItem value="winner">Winner</SelectItem>
            </SelectContent>
          </Select>

          <Select value={profile.project_completion_approach}
            onValueChange={v => setProfile({ ...profile, project_completion_approach: v })}>
            <SelectTrigger><SelectValue placeholder="Project Work Style" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="consistent_work">Consistent</SelectItem>
              <SelectItem value="deadline_driven">Deadline-driven</SelectItem>
              <SelectItem value="weekend_sprinter">Weekend Sprinter</SelectItem>
              <SelectItem value="flexible_any_style">Flexible</SelectItem>
            </SelectContent>
          </Select>

          <Select value={profile.commitment_preference}
            onValueChange={v => setProfile({ ...profile, commitment_preference: v })}>
            <SelectTrigger><SelectValue placeholder="Commitment Preference" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="generally_available">Generally Available</SelectItem>
              <SelectItem value="extracurricular_commitments">Extracurricular</SelectItem>
              <SelectItem value="technical_commitments">Technical</SelectItem>
              <SelectItem value="low_commitment">Low Commitment</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
