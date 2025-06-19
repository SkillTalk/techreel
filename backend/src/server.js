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
require("dotenv").config();
console.log("✅ MONGO URI:", process.env.MONGO_URI);

const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected Successfully"))
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1); // crash cleanly on failure
});

// Create and start server
const server = http.createServer(app);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
