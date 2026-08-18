import express from "express";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/events", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM events WHERE user_id = $1 ORDER BY start_time ASC",
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

router.post("/events", async (req, res) => {
  const { title, description = "", startTime, endTime = null, eventType = "event" } = req.body;
  if (!title?.trim() || !startTime) return res.status(400).json({ message: "Title and start time are required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO events (user_id, title, description, start_time, end_time, event_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title.trim(), description, startTime, endTime, eventType]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

router.get("/reminders", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, t.title AS task_title FROM reminders r
       LEFT JOIN tasks t ON t.id = r.task_id
       WHERE r.user_id = $1 ORDER BY r.remind_at ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
});

router.post("/reminders", async (req, res) => {
  const { title, message = "", remindAt, taskId = null } = req.body;
  if (!title?.trim() || !remindAt) return res.status(400).json({ message: "Title and reminder time are required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO reminders (user_id, task_id, title, message, remind_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, taskId, title.trim(), message, remindAt]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create reminder" });
  }
});

router.patch("/reminders/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE reminders SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [Boolean(req.body.isCompleted), req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Reminder not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update reminder" });
  }
});

router.delete("/reminders/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM reminders WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Reminder not found" });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete reminder" });
  }
});

export default router;
