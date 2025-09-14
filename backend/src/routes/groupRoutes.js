const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const mongoose = require("mongoose");

// Create a new group
router.post("/create", async (req, res) => {
  try {
    const { name, isPublic, maxMembers, adminId, category, isPaid, price, currency } = req.body;
    console.log("🔍 Creating group with data:", { name, isPublic, maxMembers, adminId });
    
    if (!name || !adminId) {
      console.log("❌ Missing fields:", { name, adminId });
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const paid = Boolean(isPaid);
    const isPublicFinal = paid ? false : (isPublic !== undefined ? isPublic : true);

    const newGroup = new Group({
      name,
      isPublic: isPublicFinal,
      maxMembers: maxMembers || 10,
      adminId,
      category: category || undefined,
      isPaid: paid,
      price: paid ? Number(price || 0) : 0,
      currency: currency || undefined,
      members: [{ user: adminId }],
    });

    console.log("🔍 New group object:", newGroup);
    await newGroup.save();
    console.log("✅ Group saved successfully:", newGroup._id);
    
    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    console.error("❌ Group creation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all groups — supports filters: category, type (public|private|paid)
router.get("/", async (req, res) => {
  try {
    const { category, type, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (type === "public") filter.isPublic = true;
    if (type === "private") filter.isPublic = false;
    if (type === "paid") filter.isPaid = true;
    if (q) filter.name = { $regex: String(q), $options: "i" };

    const groups = await Group.find(filter)
      .populate("adminId", "user_id")
      .populate("members.user", "user_id profileImage")
      .sort({ createdAt: -1 });
    
    console.log("🔍 Groups fetched:", groups.length);
    res.json(groups);
  } catch (err) {
    console.error("❌ Error fetching groups:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper to check membership status for a user
function isActiveMember(group, userId) {
  if (!group || !Array.isArray(group.members)) return false;
  const item = group.members.find((m) => String(m.user) === String(userId));
  if (!item) return false;
  if (!group.isPaid) return true; // free/private groups: treat as active
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt) > new Date();
}

// GET /groups/:groupId/status?userId=xyz → { isMember, isActive, expiresAt }
router.get("/:groupId/status", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;
    if (!mongoose.isValidObjectId(groupId) || !userId) {
      return res.status(400).json({ success: false, message: "Invalid params" });
    }
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const member = group.members.find((m) => String(m.user) === String(userId));
    const active = isActiveMember(group, userId);
    return res.json({ success: true, isMember: Boolean(member), isActive: active, expiresAt: member?.expiresAt || null, isPaid: group.isPaid, price: group.price, currency: group.currency });
  } catch (err) {
    console.error("❌ status error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /groups/:groupId/paid-join → simulate payment success then grant 3-day access
router.post("/:groupId/paid-join", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!group.isPaid) return res.status(400).json({ success: false, message: "Group is not paid" });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

    const idx = group.members.findIndex((m) => String(m.user) === String(userId));
    if (idx >= 0) {
      // renew
      group.members[idx].expiresAt = expiresAt;
    } else {
      group.members.push({ user: userId, expiresAt });
    }
    await group.save();
    return res.json({ success: true, expiresAt });
  } catch (err) {
    console.error("❌ paid-join error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get("/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members.user", "user_id profileImage")
      .populate("joinRequests.user", "user_id profileImage");

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    res.json(group);
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ➕ Join request for private groups
router.post("/:groupId/join-request", async (req, res) => {
  const { userId } = req.body;
  const { groupId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: "Missing userId" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is already a member
    const alreadyExists = group.members.some(
      (m) => m.user.toString() === userId
    );

    if (alreadyExists) {
      return res.json({ success: true, message: "User is already a member" });
    }

    // Check if user already has a pending request
    const existingRequest = group.joinRequests.find(
      (r) => r.user.toString() === userId
    );

    if (existingRequest) {
      return res.json({ success: true, message: "Join request already pending" });
    }

    // Add join request
    group.joinRequests.push({ user: userId, status: "pending" });
    await group.save();

    // Notify admin in real-time if connected
    try {
      const io = req.app.get("socketio");
      if (io) {
        io.to(String(group.adminId)).emit("group-join-request", { groupId, requesterId: userId });
      }
    } catch (e) { /* noop */ }

    res.json({ success: true, message: "Join request sent successfully" });
  } catch (err) {
    console.error("❌ Error sending join request:", err);
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

    if (alreadyExists) {
      console.log(`⚠️ User ${userId} already exists in group ${groupId}`);
      return res.json({ success: true, message: "User already a member" });
    }

    // ✅ Add member only if not already present
    group.members.push({ user: userId });
    await group.save();

    // 🔁 Re-fetch full populated group after adding member
    const updatedGroup = await Group.findById(groupId).populate("members.user", "user_id profileImage");

    // ✅ Emit to group via socket
    const io = req.app.get("socketio");
    io.to(groupId).emit("memberJoined", updatedGroup);

    console.log(`✅ Added and emitted user ${userId} in group ${groupId}`);

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


// Delete group (admin only)
router.delete("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ success: false, message: "Missing adminId" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (String(group.adminId) !== String(adminId)) {
      return res.status(403).json({ success: false, message: "Only admin can delete group" });
    }
    await Group.deleteOne({ _id: groupId });
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting group:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve all pending join requests (admin only)
router.post("/:groupId/approve-all", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ success: false, message: "Missing adminId" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (String(group.adminId) !== String(adminId)) {
      return res.status(403).json({ success: false, message: "Only admin can approve" });
    }
    let approved = 0;
    const isMember = (uid) => group.members.some(m => String(m.user) === String(uid));
    for (const reqItem of group.joinRequests) {
      if (reqItem.status !== "pending") continue;
      if (group.members.length >= (group.maxMembers || 10)) break;
      if (isMember(reqItem.user)) { reqItem.status = "accepted"; continue; }
      group.members.push({ user: reqItem.user });
      reqItem.status = "accepted";
      approved += 1;
    }
    await group.save();
    return res.json({ success: true, approved, members: group.members.length });
  } catch (err) {
    console.error("❌ Error approving requests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve a single join request (admin only)
router.post("/:groupId/approve/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ success: false, message: "Missing adminId" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (String(group.adminId) !== String(adminId)) {
      return res.status(403).json({ success: false, message: "Only admin can approve" });
    }
    const reqItem = group.joinRequests.find(r => String(r.user) === String(userId));
    if (!reqItem) return res.status(404).json({ success: false, message: "Request not found" });
    if (reqItem.status !== "pending") return res.json({ success: true });
    const alreadyMember = group.members.some(m => String(m.user) === String(userId));
    if (!alreadyMember && group.members.length < (group.maxMembers || 10)) {
      group.members.push({ user: userId });
    }
    reqItem.status = "accepted";
    await group.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error approving request:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Deny a single join request (admin only)
router.post("/:groupId/deny/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ success: false, message: "Missing adminId" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (String(group.adminId) !== String(adminId)) {
      return res.status(403).json({ success: false, message: "Only admin can deny" });
    }
    const reqItem = group.joinRequests.find(r => String(r.user) === String(userId));
    if (!reqItem) return res.status(404).json({ success: false, message: "Request not found" });
    reqItem.status = "rejected";
    await group.save();
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error denying request:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Force delete by name (platform admin only) — uses header X-Admin-Token
router.delete("/force/by-name/:name", async (req, res) => {
  try {
    const headerToken = req.headers["x-admin-token"];
    const expected = process.env.ADMIN_TOKEN || "DEV_FORCE_DELETE";
    if (!headerToken || headerToken !== expected) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const name = req.params.name;
    const result = await Group.deleteMany({ name });
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error("❌ Error force-deleting groups by name:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

