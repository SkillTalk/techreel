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

