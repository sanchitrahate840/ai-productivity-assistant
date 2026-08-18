import express from "express";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const search = req.query.search?.trim() || "";
  try {
    const { rows } = await pool.query(
      `SELECT id, title, content, category, tags, is_pinned, created_at, updated_at
       FROM notes
       WHERE user_id = $1
       AND ($2 = '' OR title ILIKE '%' || $2 || '%' OR content ILIKE '%' || $2 || '%' OR category ILIKE '%' || $2 || '%')
       ORDER BY is_pinned DESC, updated_at DESC`,
      [req.user.id, search]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

router.post("/", async (req, res) => {
  const { title, content = "", category = "general", tags = [], isPinned = false } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const { rows } = await pool.query(
      `INSERT INTO notes (user_id, title, content, category, tags, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title.trim(), content, category, tags, isPinned]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create note" });
  }
});

router.patch("/:id", async (req, res) => {
  const { title, content, category, tags, isPinned } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE notes SET
        title = COALESCE($1, title), content = COALESCE($2, content),
        category = COALESCE($3, category), tags = COALESCE($4, tags),
        is_pinned = COALESCE($5, is_pinned), updated_at = NOW()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [title, content, category, tags, isPinned, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Note not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update note" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Note not found" });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete note" });
  }
});

export default router;
