import express from "express";
import { studentStudentMatch } from "../services/studentStudentMatch.service.js";
import { studentTeacherMatch } from "../services/studentTeacherMatch.service.js";
import { projectMatch } from "../services/projectMatch.service.js";
import { NotificationModel } from "../models/Notification.model.js";
import { StudentModel } from "../models/Student.model.js";
import { TeacherModel } from "../models/Teacher.model.js";
import { ProjectModel } from "../models/Project.model.js";

const router = express.Router();

/**
 * STUDENT ↔ STUDENT MATCHES
 */
router.get("/student/:usn/students", async (req, res) => {
  try {
    const results = await studentStudentMatch(req.params.usn);
    return res.json(results || []);
  } catch (err) {
    console.error("Student-Student Match Error:", err.message);
    return res.json([]); // ✅ Always return array
  }
});

/**
 * STUDENT ↔ TEACHER MATCHES
 */
router.get("/student/:usn/teachers", async (req, res) => {
  try {
    const results = await studentTeacherMatch(req.params.usn);
    return res.json(results || []);
  } catch (err) {
    console.error("Student-Teacher Match Error:", err.message);
    return res.json([]); // ✅ Always return array
  }
});

/**
 * PROFILE ↔ PROJECT MATCHES
 */
router.get("/projects/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const results = await projectMatch(type, id);
    return res.json(results || []);
  } catch (err) {
    console.error("Project Match Error:", err.message);
    return res.json([]); // ✅ Always return array
  }
});

/**
 * FETCH NOTIFICATIONS (Unread)
 */
router.get("/notifications/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const notifications = await NotificationModel.findUnread(type, id);
    return res.json(notifications || []);
  } catch (err) {
    console.error("Fetch Notifications Error:", err.message);
    return res.json([]);
  }
});

/**
 * TOGGLE STUDENT VISIBILITY
 */
router.patch("/student/:usn/visibility", async (req, res) => {
  try {
    const { usn } = req.params;
    const { is_visible } = req.body;

    await StudentModel.updateVisibility(usn, is_visible);
    return res.json({ success: true });
  } catch (err) {
    console.error("Student visibility update error:", err.message);
    return res.status(500).json({ success: false });
  }
});

/**
 * TOGGLE TEACHER VISIBILITY
 */
router.patch("/teacher/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;

    await TeacherModel.updateVisibility(id, is_visible);
    return res.json({ success: true });
  } catch (err) {
    console.error("Teacher visibility update error:", err.message);
    return res.status(500).json({ success: false });
  }
});

/**
 * TOGGLE PROJECT ACTIVE STATUS
 */
router.patch("/project/:id/active", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await ProjectModel.updateActive(id, is_active);
    return res.json({ success: true });
  } catch (err) {
    console.error("Project active toggle error:", err.message);
    return res.status(500).json({ success: false });
  }
});

export default router;
