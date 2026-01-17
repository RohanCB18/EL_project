"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Briefcase, Users, Eye, Mail } from "lucide-react";

const BASE_URL = "http://localhost:5000";

/* ---------------- FETCH CURRENT TEACHER ---------------- */
async function fetchMyTeacherProfile(facultyId: string) {
  const res = await fetch(`${BASE_URL}/api/teacher/${facultyId}`);
  if (!res.ok) throw new Error("Failed to fetch teacher profile");
  return res.json();
}

/* ---------------- FETCH PROJECT OWNER EMAIL ---------------- */
async function fetchOwnerEmail(ownerType: string, ownerId: string) {
  if (ownerType === "student") {
    const res = await fetch(`${BASE_URL}/api/student/${ownerId}`);
    if (!res.ok) throw new Error("Failed to fetch owner student profile");
    const data = await res.json();
    return data.rvce_email;
  }

  if (ownerType === "teacher") {
    const res = await fetch(`${BASE_URL}/api/teacher/${ownerId}`);
    if (!res.ok) throw new Error("Failed to fetch owner teacher profile");
    const data = await res.json();
    return data.rvce_email;
  }

  throw new Error("Unknown owner type");
}

export default function TeacherProjectOpenings({ facultyId }: { facultyId: string }) {
  const [colleagueProjects, setColleagueProjects] = useState<any[]>([]);
  const [studentOpenings, setStudentOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const fetchOpenings = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/projects/openings/teacher/${facultyId}`
        );
        const data = await res.json();

        setColleagueProjects(data.colleagueProjects || []);
        setStudentOpenings(data.studentOpenings || []);
      } catch (err) {
        console.error("Failed to fetch teacher project openings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenings();
  }, []);

  /* ---------------- CONNECT OWNER (MAIL + NOTIF) ---------------- */
  const connectOwner = async (project: any) => {
    try {
      setConnecting(true);

      const me = await fetchMyTeacherProfile(facultyId);
      const ownerEmail = await fetchOwnerEmail(
        project.owner_type,
        project.owner_id
      );

      // 1) In-app notification
      await fetch(`${BASE_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_type: project.owner_type,
          recipient_id: project.owner_id,
          sender_type: "teacher",
          sender_id: facultyId,
          entity_type: "project",
          entity_id: String(project.project_id),
          message: `${me.name} (${me.faculty_id}) is interested in your project "${project.title}"`
        })
      });

      // 2) Email draft
      const subject = `EduConnect | Interested in your project: ${project.title}`;

      const body = `
Hi,

I'm ${me.name} (${me.faculty_id}), from ${me.department} department.

I came across your project on EduConnect and I'm interested in collaborating:

📌 Project: ${project.title}
📍 Domain: ${project.domain}
🧠 Complexity: ${project.expected_complexity}
🔎 Looking for: ${project.looking_for}

If you're open to it, I’d love to discuss how I can contribute.

Best regards,
${me.name}
${me.rvce_email}
      `.trim();

      window.location.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    } catch (err) {
      console.error(err);
      alert("Unable to connect with project owner");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return <div className="p-8">Loading project openings…</div>;

  const renderProjectCard = (p: any) => (
    <Card
      key={p.project_id}
      className="border-2 hover:border-primary/30 hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{p.title}</h3>
            <p className="text-sm text-muted-foreground">{p.domain}</p>
          </div>

          <Badge variant="outline" className="capitalize">
            {p.project_type}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {(p.tech_stack || []).slice(0, 4).map((t: string, i: number) => (
            <Badge key={i} variant="secondary">
              {t}
            </Badge>
          ))}
          {(p.tech_stack || []).length > 4 && (
            <Badge variant="secondary">+{p.tech_stack.length - 4}</Badge>
          )}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="capitalize">Complexity: {p.expected_complexity}</span>
          <span className="capitalize">Looking for: {p.looking_for}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => setSelectedProject(p)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          <Button
            className="flex-1"
            disabled={connecting}
            onClick={() => connectOwner(p)}
          >
            <Mail className="w-4 h-4 mr-2" />
            {connecting ? "Connecting..." : "Connect Owner"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-primary" />
          Project Openings
        </h2>
        <p className="text-muted-foreground mt-1">
          Colleague collaboration + student team opportunities (excluding your projects)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Colleague projects */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Colleague Project Openings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {colleagueProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No colleague projects available right now.
              </p>
            ) : (
              colleagueProjects.map(renderProjectCard)
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Student openings */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Student Projects Looking for Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentOpenings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No student openings right now.
              </p>
            ) : (
              studentOpenings.map(renderProjectCard)
            )}
          </CardContent>
        </Card>
      </div>

      {/* DETAILS MODAL */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={() => setSelectedProject(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="text-xl font-bold">{selectedProject.title}</h3>
                <p className="text-muted-foreground">{selectedProject.domain}</p>
              </div>

              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Description:</span>{" "}
                  {selectedProject.description}
                </p>
                <p>
                  <span className="font-semibold">Project Type:</span>{" "}
                  <span className="capitalize">{selectedProject.project_type}</span>
                </p>
                <p>
                  <span className="font-semibold">Expected Complexity:</span>{" "}
                  <span className="capitalize">{selectedProject.expected_complexity}</span>
                </p>
                <p>
                  <span className="font-semibold">Looking For:</span>{" "}
                  <span className="capitalize">{selectedProject.looking_for}</span>
                </p>
                <p>
                  <span className="font-semibold">Owner Type:</span>{" "}
                  <span className="capitalize">{selectedProject.owner_type}</span>
                </p>
                <p>
                  <span className="font-semibold">Owner ID:</span>{" "}
                  {selectedProject.owner_id}
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Tech Stack:</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedProject.tech_stack || []).map((t: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={connecting}
                onClick={() => connectOwner(selectedProject)}
              >
                <Mail className="w-4 h-4 mr-2" />
                {connecting ? "Connecting..." : "Connect Owner"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
