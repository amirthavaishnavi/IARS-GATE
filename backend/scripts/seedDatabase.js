/**
 * IARS-GATE: Database Seed Script
 * Loads gate_pyq_dataset.csv and student_attempts.csv into MongoDB.
 * Run once with: npm run seed
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const PYQ = require("../models/PYQ");
const Attempt = require("../models/Attempt");
const User = require("../models/User");

const DATASET_DIR = path.join(__dirname, "..", "..", "dataset");

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB. Seeding...");

  // ---- PYQs ----
  const pyqRows = await readCSV(path.join(DATASET_DIR, "gate_pyq_dataset.csv"));
  await PYQ.deleteMany({});
  await PYQ.insertMany(
    pyqRows.map((r) => ({
      question_id: r.question_id,
      year: Number(r.year),
      branch: r.branch,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty,
      marks: Number(r.marks),
      question_text: r.question_text,
    }))
  );
  console.log(`Inserted ${pyqRows.length} PYQs`);

  // ---- Student Attempts ----
  const attemptRows = await readCSV(path.join(DATASET_DIR, "student_attempts.csv"));
  await Attempt.deleteMany({});
  await Attempt.insertMany(
    attemptRows.map((r) => ({
      student_id: r.student_id,
      branch: r.branch,
      question_id: r.question_id,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty,
      marks: Number(r.marks),
      is_correct: Number(r.is_correct),
      time_taken_sec: Number(r.time_taken_sec),
    }))
  );
  console.log(`Inserted ${attemptRows.length} attempts`);

  // ---- Demo User ----
  await User.findOneAndUpdate(
    { student_id: "AMIRTHA01" },
    { student_id: "AMIRTHA01", name: "Amirtha", branch: "CSE" },
    { upsert: true }
  );
  console.log("Demo user AMIRTHA01 (CSE branch) ready");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
