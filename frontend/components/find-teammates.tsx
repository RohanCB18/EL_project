"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const CURRENT_USN = "1RV15CS001"; // temp

async function fetchMyProfile() {
  const res = await fetch(`http://localhost:5000/api/student/${CURRENT_USN}`);
  if (!res.ok) throw new Error("Failed to fetch current student profile");
  return res.json();
}

export default function FindTeammates() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/matchmaking/student/${CURRENT_USN}/students`
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
  }, []);

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
      await fetch("http://localhost:5000/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: "student",
          recipient_id: targetStudent.usn,
          sender_type: "student",
          sender_id: CURRENT_USN,
          entity_type: "profile",
          entity_id: CURRENT_USN,
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
    <div className="p-8 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        Find EL Teammates
      </h2>

      <div className="grid gap-4">
        {Array.isArray(matches) &&
          matches
            .filter((m) => m?.student) // ✅ skip broken match objects
            .map((match, idx) => {
              const s = match.student;
              const color = getMatchColor(match.match_score || 0);

              return (
                <Card
                  key={idx}
                  className={`border-2 ${color.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                >
                  <CardContent className="p-6 flex gap-6">
                    {/* Avatar */}
                    <Avatar className="w-16 h-16">
                      <AvatarFallback
                        className={`${color.bg} ${color.text} font-bold text-lg`}
                      >
                        {(s?.name || "NA")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{s?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {s?.usn} • {s?.branch} • Year {s?.year}
                          </p>
                        </div>

                        <div
                          className={`px-4 py-2 rounded-xl ${color.bg} ${color.text} border ${color.border}`}
                        >
                          <p className="text-2xl font-bold">
                            {match.match_score || 0}%
                          </p>
                          <p className="text-xs text-center">Match</p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(s?.tech_skills || []).map((skill: string, i: number) => (
                          <Badge key={i} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* Top 3 reasons */}
                      <ul className="list-disc ml-5 text-sm text-muted-foreground mb-4">
                        {(match.match_reason || []).slice(0, 3).map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedStudent(s)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>

                        <Button
                          className="flex-1"
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
        <DialogContent className="max-w-3xl animate-in fade-in zoom-in-95">
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
                    {(selectedStudent.programming_languages || []).join(", ")}
                  </p>
                  <p>Skills: {(selectedStudent.tech_skills || []).join(", ")}</p>
                  <p>
                    Domains:{" "}
                    {(selectedStudent.domain_interests || []).join(", ")}
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
