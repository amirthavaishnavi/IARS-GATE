const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { student_id, name, password, branch } = req.body;

    if (!student_id || !password || !branch) {
      return res.status(400).json({ error: "student_id, password and branch are required." });
    }

    const existing = await User.findOne({ student_id });
    if (existing) {
      return res.status(400).json({ error: "This Student ID is already registered. Please log in instead." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ student_id, name, password: hashedPassword, branch });
    await user.save();

    res.status(201).json({ student_id: user.student_id, name: user.name, branch: user.branch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { student_id, password } = req.body;

    const user = await User.findOne({ student_id });
    if (!user) {
      return res.status(400).json({ error: "No account found with this Student ID." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password." });
    }

    res.json({ student_id: user.student_id, name: user.name, branch: user.branch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;