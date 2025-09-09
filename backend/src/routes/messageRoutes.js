const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User"); // ✅ Required for inbox route


const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});




router.post("/style-message", async (req, res) => {
  const { rawText } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Style user messages with inline HTML (color, bold, italic).",
        },
        { role: "user", content: `Style this message: ${rawText}` },
      ],
    });

    const styledMessage = completion.choices[0].message.content;
    res.json({ styledMessage });
  } catch (err) {
    console.error("AI Styling Error:", err.message);
    res.status(500).json({ error: "Failed to style message" });
  }
});


// Get inbox conversations for a user
router.get("/inbox/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const convoMap = new Map();

    for (const msg of messages) {
      const otherUserId =
        msg.senderId.toString() === userId ? msg.receiverId : msg.senderId;

      if (!convoMap.has(otherUserId.toString())) {
        const user = await User.findById(otherUserId).select("_id user_id profileImage profession bio skills");
        if (user) {
          convoMap.set(otherUserId.toString(), {
            user,
            lastMessage: msg,
          });
        }
      }
    }

    const inboxList = Array.from(convoMap.values());
    res.json(inboxList);
  } catch (err) {
    console.error("Inbox fetch error:", err);
    res.status(500).json({ error: "Inbox fetch failed" });
  }
});

// Unread count for a user
router.get("/unread-count/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const count = await Message.countDocuments({
      receiverId: userId,
      seen: false,
      deletedFor: { $ne: userId },
    });
    res.json({ count });
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark all messages to this user as seen
router.post("/mark-seen/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await Message.updateMany(
      { receiverId: userId, seen: false },
      { $set: { seen: true } }
    );
    res.json({ modifiedCount: result.modifiedCount || 0 });
  } catch (err) {
    console.error("Mark seen error:", err);
    res.status(500).json({ error: "Failed to mark messages as seen" });
  }
});



  // Save message
  router.post("/", async (req, res) => {
    try {
      const message = new Message(req.body);
      const saved = await message.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Get all messages between two users
  router.get("/:userId1/:userId2", async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const messages = await Message.find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      })
        .find({ deletedFor: { $ne: userId1 } })
        .sort("createdAt");
  
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Soft-delete a conversation for one user (hide messages for userId1 only)
  router.delete("/conversation/:userId1/:userId2", async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const userA = userId1;
      const userB = userId2;
      const result = await Message.updateMany(
        {
          $or: [
            { senderId: userA, receiverId: userB },
            { senderId: userB, receiverId: userA },
          ],
          deletedFor: { $ne: userA },
        },
        { $addToSet: { deletedFor: userA } }
      );
      return res.json({ modifiedCount: result.modifiedCount || 0 });
    } catch (err) {
      console.error("Soft-delete conversation error:", err);
      return res.status(500).json({ error: "Failed to delete conversation" });
    }
  });
  

module.exports = router;

