
require('dotenv').config();
const express = require('express');
const cors = require("cors");
const http = require('http');
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const router = require("./routes/routes");
const path = require('path');
const setupSocketIO = require('./services/socketSetup');
const setupAssociations = require('./models/associations');
const mediaCleanupService = require('./mediaCleanupService');
const cluster = require('cluster');
const os = require('os');
// const helmet = require('helmet');
const compression = require('compression');
// const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const errorHandler = require('./handlers/errorHandler');



// Import models
const Room = require('./models/Room');
const RoomMember = require('./models/RoomMember');
const Chat = require('./models/Chat');
const Invitation = require('./models/Invitation');

const validateApiKey = require("./middlewares/apiMiddleWare");

const PORT = process.env.PORT || 5000;
  const app = express();
  // Security Middleware
  // app.use(helmet());
  // CORS Headers
  app.use(validateApiKey);

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // Only call setupAssociations once
  setupAssociations();

  app.use(cors());
// Compression
  app.use(compression());

// Logging
  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.use(errorHandler.productionErrors);
  } else {
    app.use(morgan('dev'));
    app.use(errorHandler.developmentErrors);
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, './uploads')));
  app.use("/api/v1", router);
  app.get('/', (req, res) => {
    res.send(`hello from port ${PORT}`);
  });

  const server = http.createServer(app);
  const io = setupSocketIO(server);

  app.get('/', (req, res) => {
    res.send('<h1>Welcome Onthego server</h1>');
  })

  const syncDatabase = async () => {
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await Room.sync();
      await RoomMember.sync();
      await Chat.sync();
      await Invitation.sync();
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log("Database synced successfully!");

      // Start server after sync
      app.listen(PORT, () => {
        console.log(`Worker running on http://localhost:${PORT}, PID: ${process.pid}`);
      });
    } catch (err) {
      console.error("Database sync error:", err);
      process.exit(1);
    }
  };

  syncDatabase();

module.exports = { app: express(), io: setupSocketIO };