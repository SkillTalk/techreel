const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    // High-level topic for discovery and filtering
    category: {
      type: String,
      enum: [
        "education",
        "music",
        "politics",
        "property",
        "technology",
        "health",
        "art",
        "sports",
        "finance",
        "other",
        "general",
      ],
      default: "general",
      index: true,
    },

    // Monetization flags — paid groups are always private to non-buyers
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 100,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isMuted: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
        // For paid groups, access is time-limited. If not set, treated as unlimited (free/private groups)
        expiresAt: { type: Date },
      },
    ],

    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);

