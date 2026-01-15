import express from "express";
import dotenv from "dotenv";
import matchmakingRoutes from "./matchmaking/routes/matchmaking.routes.js";

dotenv.config();

const app = express();

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("EduConnect Backend Running");
});

// Matchmaking APIs
app.use("/api/matchmaking", matchmakingRoutes);

export default app;
