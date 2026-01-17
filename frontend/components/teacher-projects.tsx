"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {
  FolderKanban,
  Plus,
  Save,
  Pencil,
  Trash2,
  RefreshCw
} from "lucide-react";

const CURRENT_FACULTY_ID = "FAC101"; // temp until auth
const BASE_URL = "http://localhost:5000";

type Project = {
  project_id: number;
  title: string;
  description: string;
  owner_type: "student" | "teacher";
  owner_id: string;
  domain: string;
  tech_stack: string[];
  project_type: "el" | "research" | "hackathon" | "product" | "other";
  expected_complexity: "beginner" | "intermediate" | "advanced";
  looking_for: "mentor" | "teammates" | "both";
  is_active: boolean;
  created_at: string;
};

const emptyProjectForm = {
  title: "",
  description: "",
  domain: "",
  tech_stack: [] as string[],
  project_type: "el" as Project["project_type"],
  expected_complexity: "beginner" as Project["expected_complexity"],
  looking_for: "teammates" as Project["looking_for"],
  is_active: true
};

export default function StudentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ ...emptyProjectForm });

  // Edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  // simple helper
  const activeCount = useMemo(
    () => projects.filter((p) => p.is_active).length,
    [projects]
  );

  /* ------------------------- API HELPERS ------------------------- */
  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/projects/teacher/${CURRENT_FACULTY_ID}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Could not load your projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      setCreating(true);

      const payload = {
        title: newProject.title,
        description: newProject.description,
        owner_type: "teacher",
        owner_id: CURRENT_FACULTY_ID,
        domain: newProject.domain,
        tech_stack: newProject.tech_stack,
        project_type: newProject.project_type,
        expected_complexity: newProject.expected_complexity,
        looking_for: newProject.looking_for,
        is_active: newProject.is_active
      };

      const res = await fetch(`${BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(txt);
        throw new Error("Create failed");
      }

      setOpenAdd(false);
      setNewProject({ ...emptyProjectForm });
      await fetchMyProjects();
      alert("Project created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create project (check dropdown values + backend constraints)");
    } finally {
      setCreating(false);
    }
  };

  const updateProject = async () => {
    if (!editProject) return;

    try {
      setEditing(true);

      const payload = {
        title: editProject.title,
        description: editProject.description,
        domain: editProject.domain,
        tech_stack: editProject.tech_stack,
        project_type: editProject.project_type,
        expected_complexity: editProject.expected_complexity,
        looking_for: editProject.looking_for,
        is_active: editProject.is_active
      };

      const res = await fetch(`${BASE_URL}/api/projects/${editProject.project_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(txt);
        throw new Error("Update failed");
      }

      setOpenEdit(false);
      setEditProject(null);
      await fetchMyProjects();
      alert("Project updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update project");
    } finally {
      setEditing(false);
    }
  };

  const deleteProject = async (projectId: number) => {
    const ok = confirm("Delete this project? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Delete failed");

      await fetchMyProjects();
      alert("Project deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete project");
    }
  };

  /* ------------------------- LOAD ON MOUNT ------------------------- */
  useEffect(() => {
    fetchMyProjects();
  }, []);

  /* ------------------------- UI HELPERS ------------------------- */
  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge className="bg-success/15 text-success border border-success/30">
        Active
      </Badge>
    ) : (
      <Badge className="bg-muted text-muted-foreground border">
        Inactive
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-8">Loading projects…</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-primary" />
            My Projects
          </h2>
          <p className="text-muted-foreground mt-1">
            Create, manage and update your EL / Hackathon / Research projects
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchMyProjects}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            className="gap-2"
            onClick={() => setOpenAdd(true)}
          >
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Projects</p>
            <p className="text-3xl font-bold mt-1">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            <p className="text-3xl font-bold mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Inactive Projects</p>
            <p className="text-3xl font-bold mt-1">{projects.length - activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              No projects yet. Click <b>Add Project</b> to create your first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <Card
              key={p.project_id}
              className="border-2 hover:shadow-xl hover:scale-[1.01] transition-all"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{p.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {p.domain} • {p.project_type.toUpperCase()} • {p.expected_complexity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(p.is_active)}
                    <Badge variant="outline">
                      Looking for: {p.looking_for}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {p.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {(p.tech_stack || []).map((t, i) => (
                    <Badge key={i} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 flex-1"
                    onClick={() => {
                      setEditProject({ ...p });
                      setOpenEdit(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    className="gap-2 flex-1"
                    onClick={() => deleteProject(p.project_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- ADD PROJECT MODAL ---------------- */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  placeholder="Smart Attendance using Face Recognition"
                />
              </div>

              <div className="space-y-2">
                <Label>Domain</Label>
                <Input
                  value={newProject.domain}
                  onChange={(e) =>
                    setNewProject({ ...newProject, domain: e.target.value })
                  }
                  placeholder="AI/ML, Web Dev, IoT, Cybersecurity..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Explain what the project does, your goal, and what you're building..."
                className="min-h-28"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select
                  value={newProject.project_type}
                  onValueChange={(v: any) =>
                    setNewProject({ ...newProject, project_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="el">EL</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expected Complexity</Label>
                <Select
                  value={newProject.expected_complexity}
                  onValueChange={(v: any) =>
                    setNewProject({ ...newProject, expected_complexity: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Looking For</Label>
                <Select
                  value={newProject.looking_for}
                  onValueChange={(v: any) =>
                    setNewProject({ ...newProject, looking_for: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="teammates">Teammates</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tech Stack (comma separated)</Label>
              <Input
                placeholder="React, Node.js, PostgreSQL, Python"
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    tech_stack: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean)
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Active</Label>
                <Select
                  value={newProject.is_active ? "true" : "false"}
                  onValueChange={(v) =>
                    setNewProject({ ...newProject, is_active: v === "true" })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={createProject}
                disabled={creating}
                className="gap-2"
              >
                <Save className={`w-4 h-4 ${creating ? "animate-spin" : ""}`} />
                {creating ? "Saving..." : "Create Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- EDIT PROJECT MODAL ---------------- */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>

          {!editProject ? (
            <p className="text-sm text-muted-foreground">No project selected</p>
          ) : (
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editProject.title}
                    onChange={(e) =>
                      setEditProject({ ...editProject, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={editProject.domain}
                    onChange={(e) =>
                      setEditProject({ ...editProject, domain: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editProject.description}
                  onChange={(e) =>
                    setEditProject({
                      ...editProject,
                      description: e.target.value
                    })
                  }
                  className="min-h-28"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select
                    value={editProject.project_type}
                    onValueChange={(v: any) =>
                      setEditProject({ ...editProject, project_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="el">EL</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expected Complexity</Label>
                  <Select
                    value={editProject.expected_complexity}
                    onValueChange={(v: any) =>
                      setEditProject({
                        ...editProject,
                        expected_complexity: v
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Looking For</Label>
                  <Select
                    value={editProject.looking_for}
                    onValueChange={(v: any) =>
                      setEditProject({ ...editProject, looking_for: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="teammates">Teammates</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tech Stack (comma separated)</Label>
                <Input
                  defaultValue={(editProject.tech_stack || []).join(", ")}
                  onChange={(e) =>
                    setEditProject({
                      ...editProject,
                      tech_stack: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean)
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editProject.is_active ? "true" : "false"}
                    onValueChange={(v) =>
                      setEditProject({
                        ...editProject,
                        is_active: v === "true"
                      })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={updateProject}
                  disabled={editing}
                  className="gap-2"
                >
                  <Save className={`w-4 h-4 ${editing ? "animate-spin" : ""}`} />
                  {editing ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
