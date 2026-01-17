import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // ✅ ADD THIS

import matchmakingRoutes from "./matchmaking/routes/matchmaking.routes.js";
import studentRoutes from "./matchmaking/routes/student.routes.js";
import notificationRoutes from "./matchmaking/routes/notification.routes.js";
import projectRoutes from "./matchmaking/routes/project.routes.js";

dotenv.config();

const app = express();

// ✅ ENABLE CORS (THIS FIXES YOUR ERROR)

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type"]
}));


app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("EduConnect Backend Running");
});

// Matchmaking APIs
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);

export default app;
