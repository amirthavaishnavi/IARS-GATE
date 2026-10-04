const express = require("express");
const router = express.Router();
const axios = require("axios");
const Attempt = require("../models/Attempt");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://iars-gate.onrender.com";

router.get("/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const branch = req.query.branch || "CSE";

    // Find this student's most recent quiz session
    const latest = await Attempt.findOne({ student_id: studentId })
      .sort({ attempted_at: -1 })
      .lean();

    if (!latest) {
      return res.status(400).json({
        error: "No quiz attempts found. Take the quiz first, then click Get Recommendations.",
      });
    }

    // Fetch only attempts belonging to that latest session
    const attempts = await Attempt.find({
      student_id: studentId,
      session_id: latest.session_id,
    }).lean();

    const response = await axios.post(
      `${ML_SERVICE_URL}/recommend/${studentId}`,
      { attempts },
      { params: { branch } }
    );
    res.json(response.data);
  } catch (err) {
    const mlError = err.response?.data?.error || err.message;
    console.error("ML STATUS:", err.response?.status);
console.error("ML DATA:", err.response?.data);
console.error("ML ERROR:", err.message);

const mlError =
  err.response?.data?.error ||
  err.response?.data ||
  err.message;
  }
});

module.exports = router;
