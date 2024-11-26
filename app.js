require('dotenv').config();
const express = require('express');
const cors = require("cors");
const http = require('http');
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const router = require("./routes/routes");
const setupSocketIO = require('./services/socketSetup');
const setupAssociations = require('./models/associations');

// Import models
const Room = require('./models/Room');
const RoomMember = require('./models/RoomMember');
const Chat = require('./models/Chat');

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Setup model associations
setupAssociations();

// Routes
app.use("/api/v1/", router);

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocketIO(server);

// Database sync
const syncDatabase = async () => {
  try {
    // Force sync in development only!
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Room.sync({ force: true });
    await RoomMember.sync({ force: true });
    await Chat.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log("Database synced successfully!");
    
    // Start server after sync
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database sync error:", err);
    process.exit(1);
  }
};

// Start the application
syncDatabase();

module.exports = { app, io };