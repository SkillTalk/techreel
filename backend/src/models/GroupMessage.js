const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Group" },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);

