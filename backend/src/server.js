/**
 * ===============================================
 * File: server.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    Entry point of the TechReel backend server.
 *
 * Responsibilities:
 *    - Loads environment variables
 *    - Connects to MongoDB using Mongoose
 *    - Starts the HTTP server with the Express app
 *    - (Future scope) Integrates Socket.io for real-time features
 *
 * Dependencies:
 *    - http: Node.js module to create the server
 *    - mongoose: For connecting to MongoDB Atlas
 *    - dotenv: Loads environment config
 *    - ./config/db: Custom DB connection function
 *    - ./app: Main Express application
 *
 * Purpose:
 *    Bootstraps the backend by connecting to the database and
 *    starting the server on the specified port. Acts as the runtime
 *    initiator for all backend services.
 * ===============================================
 */
/*

require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

// 1. MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// 2. Create and start HTTP server
const server = http.createServer(app);

// 3. Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend access
  },
});

// 4. In-memory map of users: userId -> socketId
const users = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // ✅ Register user
  socket.on("addUser", (userId) => {
    users.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  // ✅ Real-time message delivery
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiverSocketId = users.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", {
        senderId,
        text,
        timestamp: Date.now(),
      });
    }
  });

  // ✅ Follow/Unfollow events (your original logic)
  socket.on("follow", (data) => {
    io.emit("follow-update", data);
  });

  socket.on("unfollow", (data) => {
    io.emit("follow-update", data);
  });

  // ✅ No cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    // Do NOT remove from users map — persistent chat design
  });
});

// 5. Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});

*/


/*
require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

// 1. MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// 2. Create and start HTTP server
const server = http.createServer(app);

// 3. Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend access
  },
});

// 4. In-memory map of users: userId -> socketId
const users = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // ✅ Register user and join their own room
  socket.on("addUser", (userId) => {
    users.set(userId, socket.id);
    socket.join(userId); // user joins their unique room
    console.log(`✅ User ${userId} joined room and mapped to socket ${socket.id}`);
  });

  // ✅ Real-time message delivery using room (ensures correctness)
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const message = {
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
    };

    // Emit to receiver's room
    io.to(receiverId).emit("getMessage", message);
  });

  // ✅ Follow/Unfollow events (broadcast to all)
  socket.on("follow", (data) => {
    io.emit("follow-update", data);
  });

  socket.on("unfollow", (data) => {
    io.emit("follow-update", data);
  });

  // ✅ No cleanup on disconnect (optional)
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    // Note: user remains in users Map to allow reconnection
  });
});

// 5. Start the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});

*/
/*
require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const GroupMessage = require("./models/GroupMessage"); // ✅ Group chat DB model

const PORT = process.env.PORT || 5000;

// 1. MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// 2. Create and start HTTP server
const server = http.createServer(app);

// 3. Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.set("socketio", io);

// 4. In-memory map of users: userId -> socketId
const users = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // --- 1-on-1 Chat ---
  socket.on("addUser", (userId) => {
    users.set(userId, socket.id);
    socket.join(userId);
    console.log(`✅ User ${userId} joined room and mapped to socket ${socket.id}`);
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const message = {
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
    };
    io.to(receiverId).emit("getMessage", message);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typing", senderId);
  });

  // --- Group Chat Support ---
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`👥 Socket ${socket.id} joined group ${groupId}`);
  });
	// ✅ ADD THIS — User joins their own personal room
socket.on("registerUser", (userId) => {
  socket.join(userId); // Now we can target them directly
  console.log(`✅ User ${userId} registered for direct emits`);
});

  socket.on("sendGroupMessage", async (msg) => {
    try {
      const message = new GroupMessage({
        groupId: msg.groupId,
        senderId: msg.senderId,
        text: msg.text
      });

      const saved = await message.save();
      const populated = await saved.populate("senderId", "user_id");

      io.to(msg.groupId).emit("receiveGroupMessage", populated);
      console.log(`📨 Saved + Broadcasted group message from ${populated.senderId.user_id} in group ${msg.groupId}`);
    } catch (error) {
      console.error("❌ Error saving or sending group message:", error);
    }
  });

  // --- Follow/Unfollow (Notifications) ---
  socket.on("follow", (data) => {
    io.emit("follow-update", data);
  });

  socket.on("unfollow", (data) => {
    io.emit("follow-update", data);
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// 5. Start Server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
*/








// ✅ UPDATED server.js with Voice Call Signaling Support
require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const GroupMessage = require("./models/GroupMessage");

const PORT = process.env.PORT || 5000;

// 1. MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// 2. Create and start HTTP server
const server = http.createServer(app);

// 3. Socket.IO setup
const io = new Server(server, {
  cors: { origin: "*" },
});
app.set("socketio", io);

// 4. In-memory maps
const users = new Map(); // userId -> socketId
const voiceRooms = {};   // groupId -> [{ userId, socketId }]

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // --- 1-on-1 Chat ---
  socket.on("addUser", (userId) => {
    users.set(userId, socket.id);
    socket.join(userId);
    console.log(`✅ User ${userId} joined room and mapped to socket ${socket.id}`);
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const message = { senderId, receiverId, text, timestamp: Date.now() };
    io.to(receiverId).emit("getMessage", message);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typing", senderId);
  });

  // --- Group Chat ---
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`👥 Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on("registerUser", (userId) => {
    socket.join(userId);
    console.log(`✅ User ${userId} registered for direct emits`);
  });

  socket.on("sendGroupMessage", async (msg) => {
    try {
      const message = new GroupMessage({
        groupId: msg.groupId,
        senderId: msg.senderId,
        text: msg.text,
      });

      const saved = await message.save();
      const populated = await saved.populate("senderId", "user_id");

      io.to(msg.groupId).emit("receiveGroupMessage", populated);
      console.log(`📨 Broadcasted message from ${populated.senderId.user_id} in group ${msg.groupId}`);
    } catch (error) {
      console.error("❌ Error sending group message:", error);
    }
  });

  // --- Voice Call Signaling ---
  socket.on("join-voice-room", ({ groupId, userId }) => {
    if (!voiceRooms[groupId]) voiceRooms[groupId] = [];

    voiceRooms[groupId].push({ userId, socketId: socket.id });
    const usersInRoom = voiceRooms[groupId]
      .filter(u => u.socketId !== socket.id)
      .map(u => u.socketId);

    socket.join(groupId);
    socket.emit("all-users", usersInRoom);
  });

  socket.on("sending-signal", ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit("user-joined", { signal, callerId });
  });

  socket.on("returning-signal", ({ signal, callerId }) => {
    io.to(callerId).emit("receiving-returned-signal", { signal, id: socket.id });
  });

  // --- Follow/Unfollow ---
  socket.on("follow", (data) => io.emit("follow-update", data));
  socket.on("unfollow", (data) => io.emit("follow-update", data));

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// 5. Start Server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});

