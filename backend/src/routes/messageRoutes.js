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
        const user = await User.findById(otherUserId).select("_id user_id");
        convoMap.set(otherUserId.toString(), {
          user,
          lastMessage: msg,
        });
      }
    }

    const inboxList = Array.from(convoMap.values());
    res.json(inboxList);
  } catch (err) {
    console.error("Inbox fetch error:", err);
    res.status(500).json({ error: "Inbox fetch failed" });
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
      }).sort("createdAt");
  
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;

