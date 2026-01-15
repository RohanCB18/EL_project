import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // ✅ ADD THIS

import matchmakingRoutes from "./matchmaking/routes/matchmaking.routes.js";
import studentRoutes from "./matchmaking/routes/student.routes.js";

dotenv.config();

const app = express();

// ✅ ENABLE CORS (THIS FIXES YOUR ERROR)
app.use(
  cors({
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("EduConnect Backend Running");
});

// Matchmaking APIs
app.use("/api/matchmaking", matchmakingRoutes);

// Student profile APIs
app.use("/api/student", studentRoutes);

export default app;
