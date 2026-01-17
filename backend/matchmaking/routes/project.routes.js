import express from "express";
import { ProjectModel } from "../models/Project.model.js";

const router = express.Router();

/**
 * POST /api/projects
 * Create new project
 */
router.post("/", async (req, res) => {
  try {
    const created = await ProjectModel.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * GET /api/projects/student/:usn
 * Fetch all projects owned by student
 */
router.get("/student/:usn", async (req, res) => {
  try {
    const { usn } = req.params;
    const projects = await ProjectModel.findByOwner("student", usn);
    res.json(projects);
  } catch (err) {
    console.error("Fetch student projects error:", err);
    res.status(500).json({ error: "Failed to fetch student projects" });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update a project
 */
router.put("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    const updated = await ProjectModel.update(projectId, req.body);

    res.json(updated);
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project
 */
router.delete("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    await ProjectModel.delete(projectId);

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

/**
 * GET /api/projects/openings
 * Returns mentor openings + student openings
 */
router.get("/openings/:usn", async (req, res) => {
  try {
    const { usn } = req.params;
    const openings = await ProjectModel.findOpenings(usn);
    res.json(openings);
  } catch (err) {
    console.error("Fetch openings error:", err);
    res.status(500).json({ error: "Failed to fetch openings" });
  }
});


export default router;
