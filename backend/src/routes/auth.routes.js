import { Router } from "express";
import { pool } from "../db.js";
import { comparePassword, createToken, hashPassword, requireAuth } from "../auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Name, email and password are required" });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rowCount) return res.status(409).json({ message: "Email is already registered" });
    const passwordHash = await hashPassword(password);
    const result = await pool.query("INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email,created_at", [name.trim(), normalizedEmail, passwordHash]);
    const user = result.rows[0];
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to create account" }); }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) return res.status(400).json({ message: "Email and password are required" });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    const user = result.rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) return res.status(401).json({ message: "Invalid email or password" });
    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.json({ user: safeUser, token: createToken(safeUser) });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to log in" }); }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id,name,email,created_at FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    res.json({ user: rows[0] });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load profile" }); }
});

export default router;
