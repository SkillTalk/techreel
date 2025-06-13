/**
 * ===============================================
 * File: User.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    This file defines the Mongoose schema for the User model.
 *
 *    Schema Fields:
 *    - username: User's display name (required)
 *    - email: Unique email address (required, unique)
 *    - password: Hashed password (required)
 *    - profilePictureUrl: Optional URL for user avatar
 *    - bio: Optional user bio or about section
 *    - skills: Array of user-defined skill tags
 *
 * Options:
 *    - timestamps: Automatically adds createdAt & updatedAt
 *
 * Purpose:
 *    Serves as the blueprint for user documents in MongoDB.
 *    Used across the application for authentication, profile
 *    rendering, and user management logic.
 * ===============================================
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  // email: { type: String }, // optional now
  password: { type: String, required: true },
  qualification: String,
  skills: String,
  bio: String,
  website: String,
  email: {
    type: String,
    required: false,
    unique: false, // ✅ Remove uniqueness
    sparse: true, // ✅ Optional: tells MongoDB to skip `null` values for index
  },
  followers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "pending",
      },
    },
  ],
  following: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "pending",
      },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
