const express = require("express");
const router = express.Router();
const PYQ = require("../models/PYQ");

// GET /api/questions/:branch - fetch questions for a branch (plus Common)
router.get("/:branch", async (req, res) => {
  try {
    const branch = req.params.branch;
    const questions = await PYQ.find({ branch: { $in: ["Common", branch] } });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
