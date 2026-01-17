import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StudentModel } from "../models/Student.model.js";
import { TeacherModel } from "../models/Teacher.model.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const SALT_ROUNDS = 10;

// helper
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * SIGNUP
 * body: { role: "student"|"teacher", id: "USN/FACID", password: "xxxx" }
 */
router.post("/signup", async (req, res) => {
  try {
    const { role, id, password } = req.body;

    if (!role || !id || !password) {
      return res.status(400).json({ error: "role, id, password required" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    if (role === "student") {
      // must already exist profile OR create minimal record if you want
      const existing = await StudentModel.findByUSN(id);
      if (!existing) {
        return res.status(404).json({ error: "Student profile not found. Create profile first." });
      }

      const updated = await StudentModel.setPasswordHash(id, password_hash);
      return res.json({ success: true, user: { role, id }, updated });
    }

    if (role === "teacher") {
      const existing = await TeacherModel.findById(id);
      if (!existing) {
        return res.status(404).json({ error: "Teacher profile not found. Create profile first." });
      }

      const updated = await TeacherModel.setPasswordHash(id, password_hash);
      return res.json({ success: true, user: { role, id }, updated });
    }

    return res.status(400).json({ error: "Invalid role" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

/**
 * LOGIN
 * body: { role: "student"|"teacher", id: "USN/FACID", password: "xxxx" }
 */
router.post("/login", async (req, res) => {
  try {
    const { role, id, password } = req.body;

    if (!role || !id || !password) {
      return res.status(400).json({ error: "role, id, password required" });
    }

    let user = null;

    if (role === "student") user = await StudentModel.findByUSN(id);
    if (role === "teacher") user = await TeacherModel.findById(id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.password_hash) {
      return res.status(400).json({
        error: "No password set. Please sign up first."
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ role, id });

    return res.json({
      success: true,
      token,
      user: {
        role,
        id,
        name: user.name,
        rvce_email: user.rvce_email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
