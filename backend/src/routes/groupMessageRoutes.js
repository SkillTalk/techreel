/*const GroupMessage = require("../models/GroupMessage");

router.post("/group/messages", async (req, res) => {
  const { groupId, senderId, text } = req.body;
  try {
    const message = new GroupMessage({ groupId, senderId, text });
    const saved = await message.save();
    const populated = await saved.populate("senderId", "user_id");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "DB error", err });
  }
});

router.get("/group/messages/:groupId", async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId }).populate("senderId", "user_id");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "DB error", err });
  }
});
*/

const express = require("express");
const router = express.Router(); // ✅ YOU MISSED THIS LINE

const GroupMessage = require("../models/GroupMessage");

router.post("/messages", async (req, res) => {
  const { groupId, senderId, text } = req.body;
  try {
    const message = new GroupMessage({ groupId, senderId, text });
    const saved = await message.save();
    const populated = await saved.populate("senderId", "user_id");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "DB error", err });
  }
});

router.get("/messages/:groupId", async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId })
      .populate("senderId", "user_id");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "DB error", err });
  }
});

module.exports = router; // ✅ ALSO DON’T FORGET THIS

