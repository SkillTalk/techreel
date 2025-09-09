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
// backend/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true, trim: true },

    // optional; unique when present
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    qualification: { type: String, trim: true },

    // IMPORTANT: array of strings (fixes earlier cast error)
    skills: { type: [String], default: [] },

    bio: { type: String, trim: true },
    // Structured Bio fields
    bioHeadline: { type: String, trim: true },
    bioSummary: { type: String, trim: true },
    bioCoreSkills: { type: [String], default: [] },
    bioMotivation: { type: String, trim: true },
    bioCurrentFocus: { type: String, trim: true },
    website: { type: String, trim: true },
    profileImage: { type: String, default: "" },
    profession: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    location: { type: String, trim: true },
    education: { type: String, trim: true },
    interests: { type: [String], default: [] },

    followers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["pending", "accepted"], default: "pending" },
      },
    ],
    following: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["pending", "accepted"], default: "pending" },
      },
    ],
  },
  { timestamps: true }
);

// Helpful indexes
userSchema.index({ user_id: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Hide password in JSON
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
