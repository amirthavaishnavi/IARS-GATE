const mongoose = require("mongoose");

const pyqSchema = new mongoose.Schema({
  question_id: { type: String, required: true, unique: true },
  year: Number,
  branch: { type: String, required: true }, // "Common", "CSE", "Mechanical", "Civil", "Electrical", "ECE"
  subject: String,
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
  marks: Number,
  question_text: String,
});

module.exports = mongoose.model("PYQ", pyqSchema);
