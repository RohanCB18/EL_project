"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CURRENT_FACULTY_ID = "FAC101"; // temp

async function fetchMyTeacherProfile() {
  const res = await fetch(`http://localhost:5000/api/teacher/${CURRENT_FACULTY_ID}`);
  if (!res.ok) throw new Error("Failed to fetch current teacher profile");
  return res.json();
}

export default function FindStudents({ facultyId }: { facultyId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/matchmaking/teacher/${CURRENT_FACULTY_ID}/students`
        );

        const data = await res.json();
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("FindStudents fetch error:", err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const getMatchColor = (score: number) => {
    if (score >= 80)
      return { border: "border-success/40", bg: "bg-success/10", text: "text-success" };
    if (score >= 60)
      return { border: "border-warning/40", bg: "bg-warning/10", text: "text-warning" };
    return { border: "border-destructive/40", bg: "bg-destructive/10", text: "text-destructive" };
  };

  const handleConnectEmail = async (student: any) => {
    try {
      if (!student?.usn || !student?.rvce_email) {
        alert("Student details missing.");
        return;
      }

      // ⚠️ You don't have teacher route yet, so skip teacher fetch for now
      const subject = `EduConnect | Faculty Connection Request`;
      const body = `
Hi ${student.name},

I found your profile on EduConnect and would like to connect with you regarding collaboration / mentorship opportunities.

Best regards,
${CURRENT_FACULTY_ID}
`.trim();

      // 🔔 Notify student
      await fetch("http://localhost:5000/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: "student",
          recipient_id: student.usn,
          sender_type: "teacher",
          sender_id: CURRENT_FACULTY_ID,
          entity_type: "profile",
          entity_id: CURRENT_FACULTY_ID,
          message: `Faculty (${CURRENT_FACULTY_ID}) wants to connect with you`
        })
      });

      window.location.href = `mailto:${student.rvce_email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    } catch (err) {
      console.error(err);
      alert("Unable to connect");
    }
  };

  if (loading) return <div className="p-8">Loading student matches…</div>;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        Connect with Students
      </h2>

      <div className="grid gap-4">
        {matches
          .filter((m) => m?.student)
          .map((match, idx) => {
            const s = match.student;
            const color = getMatchColor(match.match_score || 0);

            return (
              <Card
                key={idx}
                className={`border-2 ${color.border} transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
              >
                <CardContent className="p-6 flex gap-6">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className={`${color.bg} ${color.text} font-bold text-lg`}>
                      {(s?.name || "NA")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold">{s?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {s?.usn} • {s?.branch} • Year {s?.year}
                        </p>
                      </div>

                      <div className={`px-4 py-2 rounded-xl ${color.bg} ${color.text} border ${color.border}`}>
                        <p className="text-2xl font-bold">{match.match_score || 0}%</p>
                        <p className="text-xs text-center">Match</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {(s?.tech_skills || []).slice(0, 8).map((skill: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <ul className="list-disc ml-5 text-sm text-muted-foreground mb-4">
                      {(match.match_reason || []).slice(0, 3).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedStudent(s)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>

                      <Button className="flex-1" onClick={() => handleConnectEmail(s)}>
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

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
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
                  <p>Languages: {(selectedStudent.programming_languages || []).join(", ")}</p>
                  <p>Skills: {(selectedStudent.tech_skills || []).join(", ")}</p>
                  <p>Domains: {(selectedStudent.domain_interests || []).join(", ")}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
