/**
 * ===============================================
 * File: profile.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    Defines protected user profile-related route(s).
 *
 * Routes:
 *    - GET /api/profile → Returns authenticated user details
 *
 * Middleware:
 *    - authenticate: Verifies JWT token and attaches user info to request
 *
 * Purpose:
 *    Provides a secured endpoint that can only be accessed by
 *    authenticated users. Useful for testing auth flow and building
 *    user-specific dashboard views or profile pages.
 * ===============================================
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const User = require("../models/User");

// 🔒 Protected profile route for the logged-in user
router.get("/profile", authenticate, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

// 🔍 Search users by username (case-insensitive)
router.get("/search", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const users = await User.find({
      username: { $regex: new RegExp(query, "i") },
    }).select("-password");

    res.json(users); // Return all matching users
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🌐 Public route to fetch any user profile by ID (excluding password)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
