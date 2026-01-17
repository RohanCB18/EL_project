import express from "express";
import { StudentModel } from "../models/Student.model.js";

const router = express.Router();

/**
 * CREATE OR UPDATE STUDENT PROFILE (UPSERT)
 */
router.post("/profile", async (req, res) => {
  try {
    await StudentModel.upsert(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to save profile" });
  }
});

router.get("/:usn", async (req, res) => {
  try {
    const student = await StudentModel.findByUSN(req.params.usn);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
