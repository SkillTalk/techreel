/**
 * ===============================================
 * File: app.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    Main Express application setup for TechReel backend.
 *
 * Responsibilities:
 *    - Load environment variables using dotenv
 *    - Register global middlewares (CORS, body-parser)
 *    - Mount API route modules (auth, users, reels, etc.)
 *    - Define a root test route to verify server status
 *
 * Middleware Used:
 *    - cors: Enables Cross-Origin Resource Sharing
 *    - body-parser: Parses incoming request bodies
 *
 * Routes Mounted:
 *    - /api/auth → Authentication-related routes
 *    - (Planned) /api/users, /api/reels, /api/groups, etc.
 *
 * Purpose:
 *    Acts as the entry point for initializing the Express app.
 *    This file is imported and run by `server.js`.
 * ===============================================
 */

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
