const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: {
      type: String,
      required: false,
    },
    mediaUrl: { type: String }, // base64 data URL or remote URL
    mediaType: { type: String }, // image|video|file
    fileName: { type: String },
    fileSize: { type: Number },
    seen: {
      type: Boolean,
      default: false,
    },
    // Soft-delete per viewer: if a user's id is in this array,
    // the message is hidden for that user but remains for the other party
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);


