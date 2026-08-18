import express from "express";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, priority, status, due_date, tags, created_at, updated_at
       FROM tasks WHERE user_id = $1 ORDER BY due_date NULLS LAST, created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

router.post("/", async (req, res) => {
  const { title, description = "", priority = "medium", dueDate = null, tags = [] } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority, due_date, tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title.trim(), description, priority, dueDate, tags]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

router.patch("/:id", async (req, res) => {
  const { title, description, priority, status, dueDate, tags } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        priority = COALESCE($3, priority), status = COALESCE($4, status),
        due_date = COALESCE($5, due_date), tags = COALESCE($6, tags), updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [title, description, priority, status, dueDate, tags, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Task not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update task" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Task not found" });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

export default router;
