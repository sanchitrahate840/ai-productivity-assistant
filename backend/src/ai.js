import express from "express";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message is required" });
  if (!process.env.AI_SERVICE_URL) return res.status(503).json({ message: "AI service is not configured" });

  try {
    const [tasks, notes] = await Promise.all([
      pool.query("SELECT title, description, priority, status, due_date FROM tasks WHERE user_id = $1 ORDER BY due_date NULLS LAST, created_at DESC LIMIT 50", [req.user.id]),
      pool.query("SELECT title, content, category, tags, is_pinned FROM notes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 30", [req.user.id])
    ]);

    const context = { tasks: tasks.rows, notes: notes.rows };
    const baseUrl = process.env.AI_SERVICE_URL.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.AI_SERVICE_TOKEN ? { "X-Service-Token": process.env.AI_SERVICE_TOKEN } : {}) },
      body: JSON.stringify({ message: message.trim(), history, context })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ message: data.message || "AI service failed" });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(502).json({ message: "Unable to reach AI service" });
  }
});

export default router;
