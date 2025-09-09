const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");

// Create a new post (image = skillshot, video = skillclip)
router.post("/", async (req, res) => {
  try {
    const { userId, mediaBase64, mediaUrl, mediaType, caption } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const user = await User.findById(userId).select("_id");
    if (!user) return res.status(404).json({ message: "User not found" });

    const finalMediaType = mediaType === "video" ? "video" : "image";
    const kind = finalMediaType === "video" ? "skillclip" : "skillshot";

    // For now, accept either a URL or a base64 payload and store the provided string.
    const storedUrl = mediaUrl || mediaBase64;
    if (!storedUrl) return res.status(400).json({ message: "mediaUrl or mediaBase64 is required" });

    const post = await Post.create({
      userId: user._id,
      kind,
      mediaType: finalMediaType,
      mediaUrl: storedUrl,
      caption: caption || "",
    });

    return res.status(201).json({ message: "Post created", post });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ message: "Server error while creating post" });
  }
});

// Fetch posts for a user (all/kind filter)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { kind } = req.query; // optional: skillshot or skillclip

    const filter = { userId };
    if (kind && ["skillshot", "skillclip"].includes(kind)) filter.kind = kind;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "user_id profileImage")
      .populate("comments.userId", "user_id profileImage");
    return res.json(posts);
  } catch (err) {
    console.error("Fetch posts error:", err);
    return res.status(500).json({ message: "Server error while fetching posts" });
  }
});

// Like / Unlike
router.post("/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const idx = post.likes.findIndex((id) => id.toString() === userId);
    if (idx >= 0) post.likes.splice(idx, 1);
    else post.likes.push(userId);
    await post.save();
    res.json({ likes: post.likes.length, liked: idx < 0 });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: "Server error while liking post" });
  }
});

// Add comment
router.post("/:postId/comment", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;
    if (!text) return res.status(400).json({ message: "text required" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments.push({ userId, text });
    await post.save();
    const populated = await Post.findById(postId).populate("comments.userId", "user_id profileImage");
    res.json({ comments: populated.comments });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Server error while adding comment" });
  }
});

// Feed: Prioritize following users' posts, then top-up with others in random-ish order
router.get("/feed", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { userId, cursor, limit = 20 } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    // Validate user id
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ posts: [], nextCursor: null });
    }

    const me = await User.findById(userId)
      .select("following")
      .populate("following.user", "_id user_id");
    if (!me) return res.json({ posts: [], nextCursor: null });

    const rawFollowing = Array.isArray(me.following) ? me.following : [];
    const objectIdCandidates = [];
    const usernameCandidates = [];
    for (const f of rawFollowing) {
      const u = f && f.user;
      if (!u) continue;
      // u may be ObjectId, populated doc, or string username
      if (mongoose.Types.ObjectId.isValid(String(u))) {
        objectIdCandidates.push(mongoose.Types.ObjectId(String(u)));
      } else if (u._id && mongoose.Types.ObjectId.isValid(String(u._id))) {
        objectIdCandidates.push(mongoose.Types.ObjectId(String(u._id)));
      } else if (u.user_id && typeof u.user_id === 'string') {
        usernameCandidates.push(u.user_id);
      } else if (typeof u === 'string') {
        // could be username string
        usernameCandidates.push(u);
      }
    }

    let followingIds = objectIdCandidates;
    if (followingIds.length === 0 && usernameCandidates.length > 0) {
      const users = await User.find({ user_id: { $in: usernameCandidates } }).select('_id');
      followingIds = users.map((doc) => doc._id);
    }

    const pageSize = Math.min(parseInt(limit, 10) || 20, 50);
    const followingQuota = Math.max(1, Math.ceil(pageSize * 0.6));

    // 1) Latest posts from following users (priority)
    const qFollowing = { userId: { $in: followingIds } };
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) qFollowing._id = { $lt: mongoose.Types.ObjectId(cursor) };

    let followingItems = [];
    if (followingIds.length) {
      followingItems = await Post.find(qFollowing)
        .sort({ _id: -1 })
        .limit(followingQuota)
        .populate("userId", "user_id profileImage")
        .populate("comments.userId", "user_id profileImage")
        .lean();
    }

    // 2) Top-up with posts from non-following users (exclude self and already included)
    const othersNeeded = Math.max(0, pageSize - followingItems.length);
    let otherItems = [];
    if (othersNeeded > 0) {
      const excludeObjectIds = [
        mongoose.Types.ObjectId(userId),
        ...followingIds.map((id) => mongoose.Types.ObjectId(String(id)))
      ];
      const qOthers = { userId: { $nin: excludeObjectIds } };
      // Fetch a slightly larger pool and shuffle to emulate randomness
      const poolSize = Math.min(othersNeeded * 3, 90);
      const pool = await Post.find(qOthers)
        .sort({ _id: -1 })
        .limit(poolSize)
        .populate("userId", "user_id profileImage")
        .populate("comments.userId", "user_id profileImage")
        .lean();
      // Shuffle pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      otherItems = pool.slice(0, othersNeeded);
    }

    // 3) Merge with priority for following posts, but interleave to feel fresh
    const result = [];
    let i = 0, j = 0;
    while (i < followingItems.length || j < otherItems.length) {
      const preferFollowing = Math.random() < 0.66; // 2:1 bias towards following
      if (preferFollowing && i < followingItems.length) {
        result.push(followingItems[i++]);
      } else if (j < otherItems.length) {
        result.push(otherItems[j++]);
      } else if (i < followingItems.length) {
        result.push(followingItems[i++]);
      } else {
        break;
      }
    }

    // 4) Fallback: if empty (e.g., brand new system), show latest global posts
    let finalResult = result;
    if (finalResult.length === 0) {
      finalResult = await Post.find({})
        .sort({ _id: -1 })
        .limit(pageSize)
        .populate("userId", "user_id profileImage")
        .populate("comments.userId", "user_id profileImage")
        .lean();
    }

    const nextCursor = null; // simple single-page feed for now
    return res.json({ posts: finalResult, nextCursor });
  } catch (err) {
    console.error("Feed error:", err);
    return res.status(200).json({ posts: [], nextCursor: null });
  }
});

// Simple global feed (latest posts), optional exclude userId
router.get("/global", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { exclude, limit = 20 } = req.query;
    const pageSize = Math.min(parseInt(limit, 10) || 20, 50);
    const q = {};
    if (exclude && mongoose.Types.ObjectId.isValid(exclude)) {
      q.userId = { $ne: mongoose.Types.ObjectId(exclude) };
    }
    const items = await Post.find(q)
      .sort({ _id: -1 })
      .limit(pageSize)
      .populate("userId", "user_id profileImage")
      .populate("comments.userId", "user_id profileImage")
      .lean();
    res.json({ posts: items, nextCursor: null });
  } catch (err) {
    console.error("Global feed error:", err);
    res.status(200).json({ posts: [], nextCursor: null });
  }
});

// Get a single post by id with full comments
router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("userId", "user_id profileImage")
      .populate("comments.userId", "user_id profileImage");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Delete a post (only owner can delete)
router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(post.userId) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    await Post.deleteOne({ _id: postId });
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ message: "Failed to delete post" });
  }
});

module.exports = router;



