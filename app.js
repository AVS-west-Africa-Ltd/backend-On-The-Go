require('dotenv').config();
const express = require('express');
const cors = require("cors");
const http = require('http');
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const router = require("./routes/routes");
const zoneRouter = require("./routes/zone"); // Import the zone route file
const path = require('path');
const setupSocketIO = require('./services/socketSetup');
const setupAssociations = require('./models/associations');
// const mediaCleanupService = require('./mediaCleanupService');
// const cluster = require('cluster');
// const os = require('os');
// const helmet = require('helmet');
const compression = require('compression');
// const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const errorHandler = require('./handlers/errorHandler');
const socketConfig = require('./services/UserNotificationSocket');

// Import models
const User = require('./models/User');
const Room = require('./models/Room');
const RoomMember = require('./models/RoomMember');
const Chat = require('./models/Chat');
const Invitation = require('./models/Invitation');

const validateApiKey = require("./middlewares/apiMiddleWare");
require('./cron/DeleteUserCron');

const PORT = process.env.PORT || 5002;
const app = express();

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3001', // Allow frontend origin
  methods: 'GET,POST,PUT,DELETE,OPTIONS', // Allowed HTTP methods
  allowedHeaders: 'Content-Type,Authorization,x-api-key', // Add x-api-key
  credentials: true, // Allow credentials
};

app.use(cors(corsOptions));


// Security Middleware
// app.use(helmet());

// CORS Headers (Fallback, though CORS middleware should handle this)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true"); // Allow credentials
  next();
});

// Apply middleware
app.use(validateApiKey);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(errorHandler.productionErrors);
} else {
  app.use(morgan('dev'));
  app.use(errorHandler.developmentErrors);
}

// Landing route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

// Route setup
app.use("/api/v1", router); // Existing routes
app.use("/zone", zoneRouter); // Use the zone routes

// Setup associations **before** syncing database
setupAssociations();

// Initialize Socket.IO
const server = http.createServer(app);
const io = setupSocketIO(server);
socketConfig.initialize(server);

app.get('/', (req, res) => {
  res.send('<h1>Welcome Onthego server</h1>');
});

// Sync Database with Associations
const syncDatabase = async () => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await User.sync();  // Ensure User is synced
    await Room.sync();
    await RoomMember.sync();
    await Chat.sync();
    await Invitation.sync();
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log("Database synced successfully!");

    // Start server after sync
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}, PID: ${process.pid}`);
    });
  } catch (err) {
    console.error("Database sync error:", err);
    process.exit(1);
  }
};

syncDatabase();

module.exports = { app, io };