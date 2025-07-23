const express = require("express");
const router = express.Router();
const Group = require("../models/Group");

// Create a new group
router.post("/create", async (req, res) => {
  try {
    const { name, isPublic, maxMembers, adminId } = req.body;
    if (!name || !adminId) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const newGroup = new Group({
      name,
      isPublic,
      maxMembers,
      adminId,
      members: [{ user: adminId }],
    });

    await newGroup.save();
    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    console.error("Group creation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members.user", "user_id profileImage"); // ✅ This is the fix

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ➕ Add a user to group members list
router.post("/:groupId/add-member", async (req, res) => {
  const { userId, byAdmin } = req.body;

  const { groupId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Missing userId" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const alreadyExists = group.members.some(
      (m) => m.user.toString() === userId
    );

    if (!alreadyExists) {
      group.members.push({ user: userId });
      await group.save();

      // 🔁 Re-fetch full populated group after adding member
      const updatedGroup = await Group.findById(groupId).populate("members.user", "user_id profileImage");

      // ✅ Emit to group via socket
      const io = req.app.get("socketio");
      io.to(groupId).emit("memberJoined", updatedGroup);

      console.log(`✅ Added and emitted user ${userId} in group ${groupId}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error adding member:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/:groupId/remove-member", async (req, res) => {
  const { userId, byAdmin } = req.body;  // ✅ Include byAdmin
  const { groupId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Missing userId" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    group.members = group.members.filter(
      (m) => m.user.toString() !== userId
    );

    await group.save();

    // ✅ Emit kicked event only if removed by admin
    if (byAdmin) {
      const io = req.app.get("socketio");
      io.to(userId).emit("kickedFromGroup", { groupId });
      console.log(`✅ Kicked user ${userId} from group ${groupId}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error removing member:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;

