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
    // Search across multiple fields: user_id, skills, profession, bio, location, education
    const users = await User.find({
      $or: [
        { user_id: { $regex: new RegExp(query, "i") } },
        { skills: { $in: [new RegExp(query, "i")] } },
        { profession: { $regex: new RegExp(query, "i") } },
        { bio: { $regex: new RegExp(query, "i") } },
        { location: { $regex: new RegExp(query, "i") } },
        { education: { $regex: new RegExp(query, "i") } },
        { interests: { $in: [new RegExp(query, "i")] } }
      ]
    }).select("-password");
    
    console.log(`Search for "${query}" returned ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
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
	res.json({ pending }); // ✅ Rename key from 'pending' to 'notifications'

  } catch (err) {
    console.error("Notification fetch error:", err);
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

// ❌ Reject follow request
router.put("/:id/follow/reject", async (req, res) => {
  try {
    const userId = req.params.id; // current user
    const followerId = req.body.followerId; // user who requested

    const user = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!user || !follower)
      return res.status(404).json({ message: "User not found" });

    // Remove pending request from current user's followers
    user.followers = user.followers.filter(
      (f) => f.user.toString() !== followerId
    );

    // Remove pending request from follower's following
    follower.following = follower.following.filter(
      (f) => f.user.toString() !== userId
    );

    await user.save();
    await follower.save();

    res.json({ message: "Follow request rejected" });
  } catch (err) {
    console.error("Reject follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// ➖ Unfollow user
router.post("/:id/unfollow", async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const targetId = req.params.id;

    const sender = await User.findById(senderId);
    const target = await User.findById(targetId);

    if (!sender || !target)
      return res.status(404).json({ message: "User not found" });

    // Remove from sender's following
    sender.following = sender.following.filter(
      (f) => f.user.toString() !== targetId
    );

    // Remove from target's followers
    target.followers = target.followers.filter(
      (f) => f.user.toString() !== senderId
    );

    await sender.save();
    await target.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
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

// ✅ PUT route to update profile (all fields)
router.put("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.userId.toString() !== req.params.id){
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { 
      bio,
      bioHeadline,
      bioSummary,
      bioCoreSkills,
      bioMotivation,
      bioCurrentFocus,
      portfolioProjects,
      website, 
      skills, 
      profession, 
      experienceYears, 
      location, 
      education, 
      interests 
    } = req.body;

    // Prepare update object with only provided fields
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (bioHeadline !== undefined) updateData.bioHeadline = bioHeadline;
    if (bioSummary !== undefined) updateData.bioSummary = bioSummary;
    if (bioCoreSkills !== undefined) updateData.bioCoreSkills = Array.isArray(bioCoreSkills) ? bioCoreSkills : [];
    if (bioMotivation !== undefined) updateData.bioMotivation = bioMotivation;
    if (bioCurrentFocus !== undefined) updateData.bioCurrentFocus = bioCurrentFocus;
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (portfolioProjects !== undefined) updateData.portfolioProjects = Array.isArray(portfolioProjects) ? portfolioProjects : [];
    if (profession !== undefined) updateData.profession = profession;
    if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
    if (location !== undefined) updateData.location = location;
    if (education !== undefined) updateData.education = education;
    if (interests !== undefined) updateData.interests = Array.isArray(interests) ? interests : [];


    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      console.log("User not found with ID:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("Profile updated successfully:", updatedUser);
    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let user = null;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isValidObjectId) {
      user = await User.findById(id)
        .select("-password")
        .populate("followers.user", "user_id profileImage profession bio skills followers following")
        .populate("following.user", "user_id profileImage profession bio skills followers following");
    }

    // fallback to user_id search only if not found by ObjectId or id is not valid
    if (!user) {
      user = await User.findOne({ user_id: id })
        .select("-password")
        .populate("followers.user", "user_id profileImage profession bio skills followers following")
        .populate("following.user", "user_id profileImage profession bio skills followers following");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/upload-image", authenticate, async (req, res) => {
  try {
    if (req.user.userId.toString() !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64 || !imageBase64.startsWith("data:image")) {
      return res.status(400).json({ message: "Invalid image data" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profileImage: imageBase64 },
      { new: true }
    ).select("-password");

    res.json({ imageUrl: updatedUser.profileImage });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});


module.exports = router;
