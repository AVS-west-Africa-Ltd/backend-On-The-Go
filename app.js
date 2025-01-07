// require('dotenv').config();
// const express = require('express');
// const cors = require("cors");
// const http = require('http');
// const bodyParser = require("body-parser");
// const sequelize = require("./config/database");
// const router = require("./routes/routes");
// const path = require('path');
// const setupSocketIO = require('./services/socketSetup');
// const setupAssociations = require('./models/associations');
//
// // Import models
// const Room = require('./models/Room');
// const RoomMember = require('./models/RoomMember');
// const Chat = require('./models/Chat');
//
//
// const validateApiKey = require("./middlewares/apiMiddleWare");
//
// const PORT = process.env.PORT || 5000;
// const app = express();
// // CORS Headers
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   next();
// });
//
// setupAssociations();
//
// app.use(cors());
// //app.use(validateApiKey);
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, './uploads')));
// app.use("/api/v1", router);
//
//
// // Create HTTP server
// const server = http.createServer(app);
//
// // Setup Socket.IO
// const io = setupSocketIO(server);
//
// // Database sync
// const syncDatabase = async () => {
//   try {
//     // Force sync in development only!
//     await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
//     await Room.sync();
//     await RoomMember.sync();
//     await Chat.sync();
//     await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
//
//     console.log("Database synced successfully!");
//
//     // Start server after sync
//     server.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("Database sync error:", err);
//     process.exit(1);
//   }
// };
//
// // // Start the application
// syncDatabase();
//
// module.exports = { app, io };


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
const cluster = require('cluster');
const os = require('os');

// Import models
const Room = require('./models/Room');
const RoomMember = require('./models/RoomMember');
const Chat = require('./models/Chat');

const validateApiKey = require("./middlewares/apiMiddleWare");

const PORT = process.env.PORT || 5000;

if (cluster.isMaster) {
  // Master process
  console.log(`Master process running with PID: ${process.pid}`);

  // Fork workers for each CPU core
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart workers on exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited. Restarting...`);
    cluster.fork();
  });

} else {
  // Worker process
  const app = express();

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

  setupAssociations();

  app.use(cors());
  // app.use(validateApiKey);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, './uploads')));
  app.use("/api/v1", router);
  app.get('/', (req, res) => {
    res.send(`hello from port ${PORT}`);
  });

  // Create HTTP server
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = setupSocketIO(server);

  // Database sync
  const syncDatabase = async () => {
    try {
      // Force sync in development only!
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await Room.sync();
      await RoomMember.sync();
      await Chat.sync();
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log("Database synced successfully!");

      // Start server after sync
      server.listen(PORT, () => {
        console.log(`Worker running on http://localhost:${PORT}, PID: ${process.pid}`);
      });
    } catch (err) {
      console.error("Database sync error:", err);
      process.exit(1);
    }
  };

  // Start the application
  syncDatabase();
}

module.exports = { app: express(), io: setupSocketIO };
