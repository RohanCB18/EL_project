"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { API_BASE_URL } from "@/lib/utils";

const BASE_URL = API_BASE_URL;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";




/* ---------------- SAFE ARRAY PARSER ---------------- */
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

export default function FindMentors({ usn }: { usn: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  /* ---------------- FETCH MATCHES ---------------- */
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${BASE_URL}/api/matchmaking/student/${usn}/teachers`
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Mentors fetch failed:", data);
          setMatches([]);
          setLoading(false);
          return;
        }

        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error("Mentors fetch error:", err);
        setMatches([]);
        setLoading(false);
      }
    };

    fetchMatches();
  }, [usn]);

  /* ---------------- MATCH COLOR ---------------- */
  const getMatchColor = (score: number) => {
    if (score >= 80)
      return {
        border: "border-success/40",
        bg: "bg-success/10",
        text: "text-success",
        indicator: "bg-success"
      };
    if (score >= 60)
      return {
        border: "border-warning/40",
        bg: "bg-warning/10",
        text: "text-warning",
        indicator: "bg-warning"
      };
    return {
      border: "border-destructive/40",
      bg: "bg-destructive/10",
      text: "text-destructive",
      indicator: "bg-destructive"
    };
  };

  const fetchMyProfile = async () => {
    const res = await fetch(`${BASE_URL}/api/student/${usn}`);
    if (!res.ok) throw new Error("Failed to fetch student profile");
    return res.json();
  };


  /* ---------------- CONNECT EMAIL + NOTIFICATION ---------------- */
  const handleConnectEmail = async (teacher: any) => {
    if (!teacher?.faculty_id || !teacher?.rvce_email) {
      alert("Teacher details missing, cannot connect.");
      return;
    }

    try {
      const me = await fetchMyProfile();

      const subject = `EduConnect | Mentorship Request from ${me.name}`;

      const body = `
Hi ${teacher?.name || "Professor"},

I'm ${me.name} (${me.usn}), a ${me.branch} student (Year ${me.year}).

🔹 Programming Languages: ${(me.programming_languages || []).join(", ")}
🔹 Tech Skills: ${(me.tech_skills || []).join(", ")}
🔹 Domain Interests: ${(me.domain_interests || []).join(", ")}

🧠 Past Projects:
${me.past_projects || "—"}

I found your profile on EduConnect and would be grateful for your mentorship.

Best regards,
${me.name}
${me.rvce_email}
`.trim();

      // 🔔 In-app notification for teacher
      await fetch(`${BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: "teacher",
          recipient_id: teacher.faculty_id,
          sender_type: "student",
          sender_id: usn,
          entity_type: "profile",
          entity_id: usn,
          message: `${me.name} (${me.usn}) requested mentorship`
        })
      });

      // 📧 Email
      window.location.href = `mailto:${teacher.rvce_email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    } catch (err) {
      console.error(err);
      alert("Unable to initiate mentorship request");
    }
  };

  /* ---------------- CLEANED MATCHES ---------------- */
  const cleanedMatches = useMemo(() => {
    return (Array.isArray(matches) ? matches : [])
      .map((m) => {
        const teacher = m.teacher || m.t || null;

        if (!teacher) return null;

        return {
          ...m,
          teacher: {
            ...teacher,
            areas_of_expertise: toArray(teacher.areas_of_expertise),
            domains_interested_to_mentor: toArray(
              teacher.domains_interested_to_mentor
            ),
            preferred_student_years: toArray(teacher.preferred_student_years),
            prominent_projects_or_publications: toArray(
              teacher.prominent_projects_or_publications
            )
          }
        };
      })
      .filter(Boolean);
  }, [matches]);

  if (loading) return <div className="p-8">Loading mentors…</div>;

  return (
    <div className="p-8 space-y-6">
      {/* Header + legend */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Find Mentors
          </h2>
          <p className="text-muted-foreground mt-1">
            Discover mentors who align with your interests and goals
          </p>
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

      {/* No matches */}
      {cleanedMatches.length === 0 ? (
        <Card className="border-2 border-muted">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No mentors found yet. Make sure:
            <br />• Teachers exist in DB
            <br />• Teachers have is_visible_for_matching = TRUE
            <br />• Your profile has domain_interests & skills filled
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cleanedMatches.map((match: any, idx: number) => {
            const t = match.teacher;
            const color = getMatchColor(match.match_score || 0);

            return (
              <Card
                key={idx}
                className={`border-2 ${color.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <Avatar className="w-16 h-16 border-2 group-hover:scale-110 transition-transform duration-300">
                      <AvatarFallback
                        className={`text-xl font-bold ${color.bg} ${color.text}`}
                      >
                        {(t?.name || "T")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {t?.name || "Unknown Teacher"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t?.faculty_id || "—"} • {t?.department || "—"} •{" "}
                            {t?.years_of_experience ?? "—"} yrs
                          </p>
                        </div>

                        {/* Match Score Badge */}
                        <div
                          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${color.bg} ${color.text} border-2 ${color.border} group-hover:scale-110 transition-all duration-300`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${color.indicator} animate-pulse`}
                            />
                            <span className="text-2xl font-bold">
                              {match.match_score || 0}%
                            </span>
                          </div>
                          <span className="text-xs font-medium">Match</span>
                        </div>
                      </div>

                      {/* Expertise chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(t?.areas_of_expertise || [])
                          .slice(0, 6)
                          .map((skill: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                            >
                              {skill}
                            </Badge>
                          ))}
                      </div>

                      {/* Top 3 reasons */}
                      <ul className="list-disc ml-5 text-sm text-muted-foreground mb-4">
                        {(match.match_reason || [])
                          .slice(0, 3)
                          .map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                      </ul>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 hover:bg-primary/10 hover:border-primary hover:scale-105 active:scale-95 transition-all duration-300 bg-transparent"
                          onClick={() => setSelectedTeacher(t)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>

                        <Button
                          className="flex-1 hover:scale-105 active:scale-95 transition-all duration-300"
                          onClick={() => handleConnectEmail(t)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Request Mentorship
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* PROFILE MODAL */}
      <Dialog
        open={!!selectedTeacher}
        onOpenChange={() => setSelectedTeacher(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle>Mentor Profile</DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <div className="grid gap-4 text-sm">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedTeacher.name}
                  </p>
                  <p>
                    <span className="font-medium">Faculty ID:</span>{" "}
                    {selectedTeacher.faculty_id}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedTeacher.rvce_email}
                  </p>
                  <p>
                    <span className="font-medium">Department:</span>{" "}
                    {selectedTeacher.department}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Mentorship Details</h4>
                  <p>
                    <span className="font-medium">Experience:</span>{" "}
                    {selectedTeacher.years_of_experience} years
                  </p>
                  <p>
                    <span className="font-medium">Mentoring Style:</span>{" "}
                    {selectedTeacher.mentoring_style || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Preferred Student Years:</span>{" "}
                    {toArray(selectedTeacher.preferred_student_years).join(", ") ||
                      "—"}
                  </p>
                  <p>
                    <span className="font-medium">Max Project Capacity:</span>{" "}
                    {selectedTeacher.max_projects_capacity ?? "—"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Expertise</h4>
                  <p>
                    <span className="font-medium">Mentoring Domains:</span>{" "}
                    {toArray(selectedTeacher.domains_interested_to_mentor).join(", ") ||
                      "—"}
                  </p>
                  <p>
                    <span className="font-medium">Areas of Expertise:</span>{" "}
                    {toArray(selectedTeacher.areas_of_expertise).join(", ") || "—"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">
                    Projects / Publications
                  </h4>
                  <p>
                    <span className="font-medium">Highlights:</span>{" "}
                    {toArray(selectedTeacher.prominent_projects_or_publications).join(
                      ", "
                    ) || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Publication Count:</span>{" "}
                    {selectedTeacher.publication_and_count ?? "—"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
