require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const attemptsRoutes = require("./routes/attempts");
const recommendRoutes = require("./routes/recommend");
const questionsRoutes = require("./routes/questions");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/attempts", attemptsRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "IARS-GATE Node/Express backend" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error("Check your MONGO_URI in the .env file");
  });