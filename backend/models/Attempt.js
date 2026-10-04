const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  student_id: { type: String, required: true, index: true },
  session_id: { type: String, required: true, index: true },
  branch: { type: String, required: true },
  question_id: { type: String, required: true },
  subject: String,
  topic: { type: String, required: true },
  difficulty: String,
  marks: Number,
  is_correct: { type: Number, enum: [0, 1], required: true },
  time_taken_sec: Number,
  attempted_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Attempt", attemptSchema);