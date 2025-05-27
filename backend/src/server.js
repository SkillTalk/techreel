const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");

require("dotenv").config();

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
