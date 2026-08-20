import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./tasks.js";
import noteRoutes from "./notes.js";
import calendarRoutes from "./calendar.js";
import aiRoutes from "./ai.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "*").split(",").map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error("Origin not allowed by CORS"));
}}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ name: "AI Productivity Assistant API", status: "ok" }));
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error(error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/ai", aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.message === "Origin not allowed by CORS") return res.status(403).json({ message: err.message });
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Backend listening on port ${PORT}`));
