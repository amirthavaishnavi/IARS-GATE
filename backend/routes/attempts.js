const express = require("express");
const router = express.Router();
const Attempt = require("../models/Attempt");

// POST /api/attempts - log a new quiz attempt
router.post("/", async (req, res) => {
  try {
    const attempt = new Attempt(req.body);
    await attempt.save();
    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attempts/:studentId - fetch a student's attempt history
router.get("/:studentId", async (req, res) => {
  try {
    const attempts = await Attempt.find({ student_id: req.params.studentId }).sort({ attempted_at: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
