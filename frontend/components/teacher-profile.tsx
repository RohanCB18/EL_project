"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Save, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const BASE_URL = "http://localhost:5000";
const CURRENT_FACULTY_ID = "FAC009"; // temp until auth

// ------------------ Dropdown Options ------------------
const DEPARTMENTS = [
  "CSE",
  "ISE",
  "AIML",
  "CY",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "ETE",
  "BT",
  "MCA"
];

// ✅ IMPORTANT: DB-safe values (constraint)
const MENTORING_STYLE_OPTIONS = [
  { label: "Hands-on (frequent guidance)", value: "hands_on" },
  { label: "Moderate guidance (check-ins + feedback)", value: "moderate_guidance" },
  { label: "Independent drive (student-led)", value: "independent_drive" }
];

const STUDENT_YEARS = ["1", "2", "3", "4"];

// ------------------ Helpers ------------------
function toArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map((x) => x.trim()).filter(Boolean);

  if (typeof val === "string") {
    // handles "{AI,ML}" or "AI,ML" or '["AI","ML"]'
    const cleaned = val.replaceAll("{", "").replaceAll("}", "").trim();

    // if JSON array string
    if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map((x) => x.trim()).filter(Boolean);
        }
      } catch {
        // ignore
      }
    }

    return cleaned
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeStringArray(arr: any): string[] {
  // converts ["ai,ml"] => ["ai","ml"] safely
  const base = toArray(arr);
  const expanded = base.flatMap((item) =>
    String(item)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
  // unique
  return Array.from(new Set(expanded));
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

    // allow comma separated adding too
    const items = trimmed
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const merged = Array.from(new Set([...(value || []), ...items]));
    onChange(merged);
    setTemp("");
  };

  const removeItem = (item: string) => {
    onChange((value || []).filter((x) => x !== item));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex gap-2">
        <Input
          value={temp}
          disabled={disabled}
          placeholder="Type and press Add (comma separated allowed)"
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
        {(value || []).map((item) => (
          <Badge key={item} variant="secondary" className="flex items-center gap-2">
            {item}
            {!disabled && (
              <button
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

export default function TeacherProfile() {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState<any>({
    faculty_id: CURRENT_FACULTY_ID,
    name: "",
    rvce_email: "",
    department: "",
    years_of_experience: 0,
    areas_of_expertise: [],
    domains_interested_to_mentor: [],
    prominent_projects_or_publications: [],
    publication_and_count: 0,
    mentoring_style: "", // must be DB-safe value
    preferred_student_years: [],
    max_projects_capacity: 0,
    is_visible_for_matching: true
  });

  // ------------------ Load Profile ------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BASE_URL}/api/teacher/${CURRENT_FACULTY_ID}`);

        // if no profile exists yet
        if (!res.ok) {
          setEditMode(true);
          return;
        }

        const data = await res.json();

        setProfile({
          ...data,
          areas_of_expertise: normalizeStringArray(data.areas_of_expertise),
          domains_interested_to_mentor: normalizeStringArray(data.domains_interested_to_mentor),
          prominent_projects_or_publications: normalizeStringArray(
            data.prominent_projects_or_publications
          ),
          preferred_student_years: normalizeStringArray(data.preferred_student_years)
        });

        setEditMode(false);
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
        setEditMode(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const update = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleYear = (year: string) => {
    const current = normalizeStringArray(profile.preferred_student_years);
    if (current.includes(year)) {
      update(
        "preferred_student_years",
        current.filter((y) => y !== year)
      );
    } else {
      update("preferred_student_years", [...current, year]);
    }
  };

  // ------------------ Save Profile ------------------
  const saveProfile = async () => {
    try {
      // basic validations
      if (!profile.name?.trim()) return alert("Name is required");
      if (!profile.rvce_email?.trim()) return alert("RVCE Email is required");
      if (!profile.department?.trim()) return alert("Department is required");
      if (!profile.mentoring_style?.trim())
        return alert("Mentoring style is required (choose from dropdown)");

      const payload = {
        ...profile,
        years_of_experience: Number(profile.years_of_experience) || 0,
        publication_and_count: Number(profile.publication_and_count) || 0,
        max_projects_capacity: Number(profile.max_projects_capacity) || 0,

        // ensure arrays are real arrays
        areas_of_expertise: normalizeStringArray(profile.areas_of_expertise),
        domains_interested_to_mentor: normalizeStringArray(profile.domains_interested_to_mentor),
        prominent_projects_or_publications: normalizeStringArray(
          profile.prominent_projects_or_publications
        ),
        preferred_student_years: normalizeStringArray(profile.preferred_student_years),

        // DB-safe mentoring style (constraint)
        mentoring_style: profile.mentoring_style,

        is_visible_for_matching: profile.is_visible_for_matching ?? true
      };

      const res = await fetch(`${BASE_URL}/api/teacher/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Save failed:", data);
        alert(data?.error || "Failed to save profile");
        return;
      }

      setProfile({
        ...data,
        areas_of_expertise: normalizeStringArray(data.areas_of_expertise),
        domains_interested_to_mentor: normalizeStringArray(data.domains_interested_to_mentor),
        prominent_projects_or_publications: normalizeStringArray(
          data.prominent_projects_or_publications
        ),
        preferred_student_years: normalizeStringArray(data.preferred_student_years)
      });

      setEditMode(false);
      alert("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    }
  };

  const headerRight = useMemo(() => {
    if (editMode) {
      return (
        <div className="flex gap-2">
          <Button onClick={saveProfile}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={() => setEditMode(false)}>
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
  }, [editMode, profile]);

  if (loading) return <div className="p-8">Loading teacher profile…</div>;

  // show selected label for mentoring style in UI
  const mentoringStyleLabel =
    MENTORING_STYLE_OPTIONS.find((x) => x.value === profile.mentoring_style)?.label || "";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Teacher Profile</h2>
        {headerRight}
      </div>

      {/* Basic Info */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Faculty ID</Label>
            <Input value={profile.faculty_id} disabled />
          </div>

          <div>
            <Label>Name</Label>
            <Input
              value={profile.name}
              disabled={!editMode}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <Label>RVCE Email</Label>
            <Input
              value={profile.rvce_email}
              disabled={!editMode}
              onChange={(e) => update("rvce_email", e.target.value)}
            />
          </div>

          {/* Department Dropdown */}
          <div>
            <Label>Department</Label>
            <Select
              value={profile.department || ""}
              onValueChange={(v) => update("department", v)}
              disabled={!editMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Years of Experience</Label>
            <Input
              type="number"
              value={profile.years_of_experience}
              disabled={!editMode}
              onChange={(e) => update("years_of_experience", e.target.value)}
            />
          </div>

          <div>
            <Label>Max Projects Capacity</Label>
            <Input
              type="number"
              value={profile.max_projects_capacity}
              disabled={!editMode}
              onChange={(e) => update("max_projects_capacity", e.target.value)}
            />
          </div>

          <div>
            <Label>Publication Count</Label>
            <Input
              type="number"
              value={profile.publication_and_count}
              disabled={!editMode}
              onChange={(e) => update("publication_and_count", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Switch
              checked={!!profile.is_visible_for_matching}
              disabled={!editMode}
              onCheckedChange={(v) => update("is_visible_for_matching", v)}
            />
            <Label>Visible for matching</Label>
          </div>
        </CardContent>
      </Card>

      {/* Mentorship */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Mentorship Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Mentoring Style Dropdown (DB-safe values) */}
          <div>
            <Label>Mentoring Style</Label>
            <Select
              value={profile.mentoring_style || ""}
              onValueChange={(v) => update("mentoring_style", v)}
              disabled={!editMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mentoring style">
                  {mentoringStyleLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MENTORING_STYLE_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            
          </div>

          {/* Preferred Student Years */}
          <div className="space-y-2">
            <Label>Preferred Student Years</Label>

            <div className="flex flex-wrap gap-2">
              {STUDENT_YEARS.map((year) => {
                const selected = normalizeStringArray(profile.preferred_student_years).includes(
                  year
                );

                return (
                  <Button
                    key={year}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    disabled={!editMode}
                    onClick={() => toggleYear(year)}
                  >
                    Year {year}
                  </Button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Select one or more student years you prefer mentoring.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expertise */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Expertise & Domains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ArrayInput
            label="Areas of Expertise"
            value={normalizeStringArray(profile.areas_of_expertise)}
            disabled={!editMode}
            onChange={(v) => update("areas_of_expertise", normalizeStringArray(v))}
          />

          <ArrayInput
            label="Domains Interested to Mentor"
            value={normalizeStringArray(profile.domains_interested_to_mentor)}
            disabled={!editMode}
            onChange={(v) => update("domains_interested_to_mentor", normalizeStringArray(v))}
          />
        </CardContent>
      </Card>

      {/* Publications */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Projects / Publications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ArrayInput
            label="Prominent Projects or Publications"
            value={normalizeStringArray(profile.prominent_projects_or_publications)}
            disabled={!editMode}
            onChange={(v) =>
              update("prominent_projects_or_publications", normalizeStringArray(v))
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
