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

const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");

require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ Connection error:", err));
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// Create server
const server = http.createServer(app);

// (Later) Attach Socket.io here
// const io = require('socket.io')(server, { cors: { origin: "*" } });
// require('./src/sockets/chatSocket')(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
