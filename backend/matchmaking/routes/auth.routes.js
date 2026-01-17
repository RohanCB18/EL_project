import express from "express";
import { AuthModel } from "../models/Auth.model.js";

const router = express.Router();

/* ---------------- SIGNUP ---------------- */
router.post("/signup", async (req, res) => {
  try {
    const { user_type, user_id, password } = req.body;

    if (!user_type || !user_id || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const created = await AuthModel.signup({ user_type, user_id, password });

    if (!created) {
      return res.status(409).json({ error: "User already exists. Please login." });
    }

    return res.json({ message: "Signup successful", user: created });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

/* ---------------- LOGIN ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { user_type, user_id, password } = req.body;

    const result = await AuthModel.login({ user_type, user_id, password });

    if (!result.ok) {
      return res.status(401).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, user: result.user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});


export default router;
