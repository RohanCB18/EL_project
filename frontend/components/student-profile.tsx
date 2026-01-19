"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Save, XCircle, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { upsertStudentProfile, toggleStudentVisibility } from "@/lib/student";

import { API_BASE_URL } from "@/lib/utils";
const BASE_URL = API_BASE_URL;
// ❌ removed hardcoded CURRENT_USN

const BRANCHES = ["CSE", "ISE", "AIML", "CY", "ECE", "EEE", "ME", "CE", "ETE", "BT", "MCA"];
const YEARS = ["1", "2", "3", "4"];
const GENDERS = ["male", "female", "other"];
const RESIDENCE = ["hostellite", "pg", "day_scholar"];

const ACHIEVEMENTS = ["none", "participant", "finalist", "winner"];

const WORK_STYLES = [
  "consistent_work",
  "deadline_driven",
  "weekend_sprinter",
  "flexible_any_style"
];

const COMMITMENT_PREFS = [
  "generally_available",
  "extracurricular_commitments",
  "technical_commitments",
  "low_commitment"
];

function toArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
      .replaceAll("{", "")
      .replaceAll("}", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function ArrayInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: string[];
  disabled?: boolean;
  onChange: (v: string[]) => void;
}) {
  const [temp, setTemp] = useState("");

  const addItem = () => {
    const trimmed = temp.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setTemp("");
      return;
    }
    onChange([...value, trimmed]);
    setTemp("");
  };

  const removeItem = (item: string) => {
    onChange(value.filter((x) => x !== item));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex gap-2">
        <Input
          className="flex-1 w-full"
          value={temp}
          disabled={disabled}
          placeholder="Type and press Add"
          onChange={(e) => setTemp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" disabled={disabled} onClick={addItem}>
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="flex items-center gap-2">
            {item}
            {!disabled && (
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item)}
              >
                ✕
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function StudentProfile({ usn }: { usn: string }) {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<any>({
    name: "",
    usn: usn,
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
    is_visible_for_matching: true
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BASE_URL}/api/student/${usn}`);
        if (!res.ok) {
          // no profile exists yet -> allow create mode
          setEditMode(true);
          return;
        }

        const data = await res.json();

        setProfile((prev: any) => ({
          ...prev,
          ...data,
          usn: data.usn || usn,
          programming_languages: toArray(data.programming_languages),
          tech_skills: toArray(data.tech_skills),
          domain_interests: toArray(data.domain_interests),
          past_projects: data.past_projects ?? ""
        }));

        // profile exists -> lock by default
        setEditMode(false);
      } catch (err) {
        console.error("Failed to load student profile:", err);
        setEditMode(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []); // (keeping as-is)

  const update = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload = {
        ...profile,
        usn: usn, // ✅ ensure correct logged-in usn always saved
        cgpa: profile.cgpa === "" ? null : Number(profile.cgpa),
        average_el_marks: profile.average_el_marks === "" ? null : Number(profile.average_el_marks),
        hackathon_participation_count: Number(profile.hackathon_participation_count) || 0,
        year: profile.year === "" ? null : Number(profile.year)
      };

      await upsertStudentProfile(payload);

      alert("Profile saved successfully");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    try {
      // Optimistic update
      setProfile((prev: any) => ({ ...prev, is_visible_for_matching: checked }));

      await toggleStudentVisibility(usn, checked);
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      // Revert on failure
      setProfile((prev: any) => ({ ...prev, is_visible_for_matching: !checked }));
      alert("Failed to update visibility setting.");
    }
  };

  const headerRight = useMemo(() => {
    if (editMode) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className={`w-4 h-4 mr-2 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setEditMode(false)}
            disabled={isSaving}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      );
    }

    return (
      <Button variant="outline" onClick={() => setEditMode(true)}>
        <Pencil className="w-4 h-4 mr-2" />
        Edit Profile
      </Button>
    );
  }, [editMode, isSaving]);


  if (loading) return <div className="p-8">Loading student profile…</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-foreground">
          <User className="w-8 h-8 text-primary" />
          Student Profile
        </h2>
        {headerRight}
      </div>

      {/* BASIC / PERSONAL INFO */}
      <Card className="glass border border-white/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-bold">Personal Information</CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Full Name</Label>
            <Input
              className="w-full bg-white/50 border-white/50 focus:bg-white transition-all mt-1.5"
              value={profile.name}
              disabled={!editMode}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <Label>USN</Label>
            <Input className="w-full bg-white/50 border-white/50 mt-1.5" value={profile.usn} disabled />
          </div>

          <div>
            <Label>RVCE Email</Label>
            <Input
              className="w-full bg-white/50 border-white/50 focus:bg-white transition-all mt-1.5"
              value={profile.rvce_email}
              disabled={!editMode}
              onChange={(e) => update("rvce_email", e.target.value)}
            />
          </div>

          <div>
            <Label>Gender</Label>
            <Select
              value={profile.gender || ""}
              onValueChange={(v) => update("gender", v)}
              disabled={!editMode}
            >
              <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Residence</Label>
            <Select
              value={profile.residence || ""}
              onValueChange={(v) => update("residence", v)}
              disabled={!editMode}
            >
              <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                <SelectValue placeholder="Select residence" />
              </SelectTrigger>
              <SelectContent>
                {RESIDENCE.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 mt-8">
            <Switch
              checked={!!profile.is_visible_for_matching}
              onCheckedChange={handleVisibilityToggle}
            />
            <Label>Visible for matching</Label>
          </div>
        </CardContent>
      </Card>

      {/* ACADEMICS */}
      <Card className="glass border border-white/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-bold">Academic Information</CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-6">
          <div>
            <Label>Branch</Label>
            <Select
              value={profile.branch || ""}
              onValueChange={(v) => update("branch", v)}
              disabled={!editMode}
            >
              <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Year</Label>
            <Select
              value={profile.year ? String(profile.year) : ""}
              onValueChange={(v) => update("year", v)}
              disabled={!editMode}
            >
              <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Section</Label>
            <Input
              className="w-full bg-white/50 border-white/50 mt-1.5"
              value={profile.section}
              disabled={!editMode}
              onChange={(e) => update("section", e.target.value)}
            />
          </div>

          <div>
            <Label>CGPA</Label>
            <Input
              className="w-full bg-white/50 border-white/50 mt-1.5"
              type="number"
              value={profile.cgpa ?? ""}
              disabled={!editMode}
              onChange={(e) => update("cgpa", e.target.value)}
            />
          </div>

          <div>
            <Label>Average EL Marks</Label>
            <Input
              className="w-full bg-white/50 border-white/50 mt-1.5"
              type="number"
              value={profile.average_el_marks ?? ""}
              disabled={!editMode}
              onChange={(e) => update("average_el_marks", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* TECHNICAL */}
      <Card className="glass border border-white/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-bold">Technical Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <ArrayInput
            label="Programming Languages"
            value={toArray(profile.programming_languages)}
            disabled={!editMode}
            onChange={(v) => update("programming_languages", v)}
          />

          <ArrayInput
            label="Tech Skills"
            value={toArray(profile.tech_skills)}
            disabled={!editMode}
            onChange={(v) => update("tech_skills", v)}
          />

          <ArrayInput
            label="Domain Interests"
            value={toArray(profile.domain_interests)}
            disabled={!editMode}
            onChange={(v) => update("domain_interests", v)}
          />
        </CardContent>
      </Card>

      {/* PROJECTS & PREFERENCES */}
      <Card className="glass border border-white/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-primary font-bold">Projects & Preferences</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <Label>Past Projects</Label>
            <Textarea
              className="w-full bg-white/50 border-white/50 mt-1.5 min-h-[100px]"
              value={profile.past_projects || ""}
              disabled={!editMode}
              placeholder="Describe your past projects"
              onChange={(e) => update("past_projects", e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Hackathon Participation Count</Label>
              <Input
                className="w-full bg-white/50 border-white/50 mt-1.5"
                type="number"
                value={profile.hackathon_participation_count ?? 0}
                disabled={!editMode}
                onChange={(e) =>
                  update("hackathon_participation_count", Number(e.target.value))
                }
              />
            </div>

            <div>
              <Label>Hackathon Achievement Level</Label>
              <Select
                value={profile.hackathon_achievement_level || ""}
                onValueChange={(v) => update("hackathon_achievement_level", v)}
                disabled={!editMode}
              >
                <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                  <SelectValue placeholder="Select achievement level" />
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENTS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Project Work Style</Label>
              <Select
                value={profile.project_completion_approach || ""}
                onValueChange={(v) => update("project_completion_approach", v)}
                disabled={!editMode}
              >
                <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                  <SelectValue placeholder="Select work style" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_STYLES.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Commitment Preference</Label>
              <Select
                value={profile.commitment_preference || ""}
                onValueChange={(v) => update("commitment_preference", v)}
                disabled={!editMode}
              >
                <SelectTrigger className="w-full bg-white/50 border-white/50 mt-1.5">
                  <SelectValue placeholder="Select commitment preference" />
                </SelectTrigger>
                <SelectContent>
                  {COMMITMENT_PREFS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
