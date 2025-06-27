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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// Create and start HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("follow", (data) => {
    io.emit("follow-update", data);
  });

  socket.on("unfollow", (data) => {
    io.emit("follow-update", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
*/




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

