const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },
  name: String,
  password: { type: String, required: true },
  branch: { type: String, required: true }, // CSE, Mechanical, Civil, Electrical, ECE
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);