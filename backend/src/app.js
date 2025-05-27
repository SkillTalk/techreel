const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
//const reelRoutes = require("./routes/reelRoutes");
// Add other routes as needed...

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
//app.use("/api/reels", reelRoutes);
// Add match, group, chat routes similarly

// Root Test Route
app.get("/", (req, res) => {
  res.send("TechReel backend is running!");
});

module.exports = app;
