import express from "express";
import { TeacherModel } from "../models/Teacher.model.js";

const router = express.Router();

/**
 * POST /api/teacher/profile
 * Upsert teacher profile
 */
router.post("/profile", async (req, res) => {
  try {
    const saved = await TeacherModel.upsert(req.body);
    return res.json(saved);
  } catch (err) {
    console.error("Upsert teacher error:", err);
    return res.status(500).json({ error: "Failed to save teacher profile" });
  }
});

/**
 * GET /api/teacher/:id
 * Fetch teacher profile by faculty_id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await TeacherModel.findById(id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.json(teacher);
  } catch (err) {
    console.error("Fetch teacher error:", err);
    return res.status(500).json({ error: "Failed to fetch teacher" });
  }
});



export default router;
