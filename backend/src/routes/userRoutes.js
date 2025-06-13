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
  if (!query)
    return res.status(400).json({ message: "Search query is required" });

  try {
    const users = await User.find({
      user_id: { $regex: new RegExp(query, "i") },
    }).select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🌐 Public route to fetch any user profile by ID (excluding password)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers.user", "user_id")
      .populate("following.user", "user_id"); // ✅ ADD THIS

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT route to update profile (bio, website)
router.put("/:id", async (req, res) => {
  try {
    const { bio, website } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { bio, website },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ➕ Send follow request
router.post("/:id/follow", async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const targetId = req.params.id;

    const sender = await User.findById(senderId);
    const target = await User.findById(targetId);

    if (!sender || !target)
      return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = sender.following.find(
      (f) => f.user.toString() === targetId
    );
    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already followed or requested" });
    }

    sender.following.push({ user: targetId, status: "pending" });
    target.followers.push({ user: senderId, status: "pending" });

    await sender.save();
    await target.save();

    res.json({ message: "Follow request sent" });
  } catch (error) {
    console.error("Follow request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Accept follow request
router.put("/:id/follow/accept", async (req, res) => {
  try {
    const userId = req.params.id;
    const followerId = req.body.followerId;

    const user = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!user || !follower)
      return res.status(404).json({ message: "User not found" });

    const userFollower = user.followers.find(
      (f) => f.user.toString() === followerId
    );
    const followerFollowing = follower.following.find(
      (f) => f.user.toString() === userId
    );

    if (userFollower) userFollower.status = "accepted";
    if (followerFollowing) followerFollowing.status = "accepted";

    await user.save();
    await follower.save();

    res.json({ message: "Follow request accepted" });
  } catch (err) {
    console.error("Accept follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔔 Notifications: Get pending follow requests
router.get("/:id/notifications", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers.user",
      "user_id"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const pending = user.followers.filter((f) => f.status === "pending");
    res.json({ pending });
  } catch (err) {
    console.error("Notification fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
