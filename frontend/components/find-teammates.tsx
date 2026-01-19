"use client";

import { useEffect, useState } from "react";
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

// ✅ removed hardcoded CURRENT_USN

export default function FindTeammates({ usn }: { usn: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // ✅ moved inside component so it can use `usn`
  const fetchMyProfile = async () => {
    const res = await fetch(`${BASE_URL}/api/student/${usn}`);
    if (!res.ok) throw new Error("Failed to fetch current student profile");
    return res.json();
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${BASE_URL}/api/matchmaking/student/${usn}/students`
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Teammates fetch failed:", data);
          setMatches([]);
          setLoading(false);
          return;
        }

        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error("Teammates fetch error:", err);
        setMatches([]);
        setLoading(false);
      }
    };

    fetchMatches();
  }, [usn]); // ✅ important

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return {
        border: "border-success/40",
        bg: "bg-success/10",
        text: "text-success"
      };
    if (score >= 60)
      return {
        border: "border-warning/40",
        bg: "bg-warning/10",
        text: "text-warning"
      };
    return {
      border: "border-destructive/40",
      bg: "bg-destructive/10",
      text: "text-destructive"
    };
  };

  const handleConnectEmail = async (targetStudent: any) => {
    if (!targetStudent?.usn || !targetStudent?.rvce_email) {
      alert("Student details missing, cannot connect.");
      return;
    }

    try {
      const me = await fetchMyProfile();

      const subject = `EduConnect | Collaboration Request from ${me.name}`;

      const body = `
Hi ${targetStudent.name},

I'm ${me.name} (${me.usn}), a ${me.branch} student (Year ${me.year}).

🔹 Programming Languages: ${(me.programming_languages || []).join(", ")}
🔹 Tech Skills: ${(me.tech_skills || []).join(", ")}
🔹 Domain Interests: ${(me.domain_interests || []).join(", ")}

🧠 Past Projects:
${me.past_projects || "—"}

I found your profile on EduConnect and would love to collaborate with you.

Best regards,
${me.name}
${me.rvce_email}
`.trim();

      // 🔔 CREATE IN-APP NOTIFICATION
      await fetch(`${BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: "student",
          recipient_id: targetStudent.usn,
          sender_type: "student",
          sender_id: usn,
          entity_type: "profile",
          entity_id: usn,
          message: `${me.name} (${me.usn}) wants to connect with you`
        })
      });

      const mailto = `mailto:${targetStudent.rvce_email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
    } catch (err) {
      console.error(err);
      alert("Unable to initiate email connection");
    }
  };

  if (loading) return <div className="p-8">Loading matches…</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-3 text-foreground">
        <Users className="w-8 h-8 text-primary" />
        Find EL Teammates
      </h2>

      <div className="grid gap-6">
        {Array.isArray(matches) &&
          matches
            .filter((m) => m?.student) // ✅ skip broken match objects
            .map((match, idx) => {
              const s = match.student;
              const color = getMatchColor(match.match_score || 0);

              return (
                <Card
                  key={idx}
                  className={`glass border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color.border} shadow-sm`}
                >
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar */}
                    <Avatar className="w-16 h-16 rounded-2xl shadow-sm">
                      <AvatarFallback
                        className={`${color.bg} ${color.text} font-bold text-lg rounded-2xl`}
                      >
                        {(s?.name || "NA")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{s?.name}</h3>
                          <p className="text-sm text-muted-foreground font-medium mt-1">
                            <span className="font-mono bg-secondary/30 px-1.5 py-0.5 rounded text-foreground">{s?.usn}</span> • {s?.branch} • Year {s?.year}
                          </p>
                        </div>

                        <div
                          className={`px-4 py-2 rounded-xl flex flex-col items-center ${color.bg} ${color.text} border ${color.border}`}
                        >
                          <p className="text-2xl font-bold font-sans">
                            {match.match_score || 0}%
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Match</p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(s?.tech_skills || []).map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-white/50 hover:bg-white text-foreground border border-black/5">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* Top 3 reasons */}
                      <div className="bg-white/40 rounded-xl p-4 mb-5 border border-white/50">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Why you match</p>
                        <ul className="list-disc ml-4 text-sm text-muted-foreground space-y-1">
                          {(match.match_reason || [])
                            .slice(0, 3)
                            .map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent border-primary/20 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                          onClick={() => setSelectedStudent(s)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>

                        <Button
                          className="flex-1 shadow-md hover:shadow-lg transition-all"
                          onClick={() => handleConnectEmail(s)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* PROFILE MODAL */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="grid gap-4 text-sm">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <p>Name: {selectedStudent.name}</p>
                  <p>USN: {selectedStudent.usn}</p>
                  <p>Email: {selectedStudent.rvce_email}</p>
                  <p>Gender: {selectedStudent.gender}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Academic Information</h4>
                  <p>Branch: {selectedStudent.branch}</p>
                  <p>Year: {selectedStudent.year}</p>
                  <p>Section: {selectedStudent.section}</p>
                  <p>Average EL Marks: {selectedStudent.average_el_marks}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Technical Profile</h4>
                  <p>
                    Languages:{" "}
                    {Array.isArray(selectedStudent.programming_languages)
                      ? selectedStudent.programming_languages.join(", ")
                      : selectedStudent.programming_languages}
                  </p>
                  <p>
                    Skills:{" "}
                    {Array.isArray(selectedStudent.tech_skills)
                      ? selectedStudent.tech_skills.join(", ")
                      : selectedStudent.tech_skills}
                  </p>
                  <p>
                    Domains:{" "}
                    {Array.isArray(selectedStudent.domain_interests)
                      ? selectedStudent.domain_interests.join(", ")
                      : selectedStudent.domain_interests}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Projects & Preferences</h4>
                  <p>Past Projects: {selectedStudent.past_projects}</p>
                  <p>
                    Hackathon Count:{" "}
                    {selectedStudent.hackathon_participation_count}
                  </p>
                  <p>
                    Achievement: {selectedStudent.hackathon_achievement_level}
                  </p>
                  <p>Work Style: {selectedStudent.project_completion_approach}</p>
                  <p>Commitment: {selectedStudent.commitment_preference}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
