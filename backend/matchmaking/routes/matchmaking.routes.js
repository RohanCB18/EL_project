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
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * STUDENT ↔ TEACHER MATCHES
 */
router.get("/student/:usn/teachers", async (req, res) => {
  try {
    const results = await studentTeacherMatch(req.params.usn);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PROFILE ↔ PROJECT MATCHES
 */
router.get("/projects/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const results = await projectMatch(type, id);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * FETCH NOTIFICATIONS
 */
router.get("/notifications/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const notifications = await NotificationModel.findUnread(type, id);
  res.json(notifications);
});


/**
 * TOGGLE STUDENT VISIBILITY
 */
router.patch("/student/:usn/visibility", async (req, res) => {
  const { usn } = req.params;
  const { is_visible } = req.body;

  await StudentModel.updateVisibility(usn, is_visible);
  res.json({ success: true });
});

/**
 * TOGGLE TEACHER VISIBILITY
 */
router.patch("/teacher/:id/visibility", async (req, res) => {
  const { id } = req.params;
  const { is_visible } = req.body;

  await TeacherModel.updateVisibility(id, is_visible);
  res.json({ success: true });
});

/**
 * TOGGLE PROJECT ACTIVE STATUS
 */
router.patch("/project/:id/active", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  await ProjectModel.updateActive(id, is_active);
  res.json({ success: true });
});


export default router;
