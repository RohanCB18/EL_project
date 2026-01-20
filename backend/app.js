import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./matchmaking/routes/auth.routes.js";
import matchmakingRoutes from "./matchmaking/routes/matchmaking.routes.js";
import studentRoutes from "./matchmaking/routes/student.routes.js";
import notificationRoutes from "./matchmaking/routes/notification.routes.js";
import projectRoutes from "./matchmaking/routes/project.routes.js";
import teacherRoutes from "./matchmaking/routes/teacher.routes.js";

dotenv.config();

const app = express();

// ✅ Allowed Frontend Origins (localhost + IP)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.248.74.22:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (Postman/curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight support for all routes
app.options("*", cors());

// Body parser
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("EduConnect Backend Running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teacher", teacherRoutes);

export default app;
