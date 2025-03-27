require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const sequelize = require("./config/database");
const router = require("./routes/routes");
const zoneRouter = require("./routes/zone");
const path = require("path");
const setupSocketIO = require("./services/socketSetup");
const setupAssociations = require("./models/associations");
const compression = require("compression");
const morgan = require("morgan");
const errorHandler = require("./handlers/errorHandler");
const socketConfig = require("./services/UserNotificationSocket");

// Import models
const User = require("./models/User");
const Room = require("./models/Room");
const RoomMember = require("./models/RoomMember");
const Chat = require("./models/Chat");
const Invitation = require("./models/Invitation");

// Add Swagger imports
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const validateApiKey = require("./middlewares/apiMiddleWare");
require("./cron/DeleteUserCron");

const PORT = process.env.PORT || 5000;
const app = express();

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Onthego Server API",
    version: "1.0.0",
    description: "API documentation for Onthego server",
    contact: {
      name: "On The Go Africa",
      email: "onthego@aventurestud.io",
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api/v1/`,
      description: "Development server",
    },
    {
      url: "http://api-dev.onthegoafrica.com/api/v1/",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    "./routes/*.js", // Include all route files
    // "./models/*.js",
    "./swaggerModels.js",
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

app.use(cors());

// CORS Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Apply middleware
app.use(validateApiKey);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Logging
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
  app.use(errorHandler.productionErrors);
} else {
  app.use(morgan("dev"));
  app.use(errorHandler.developmentErrors);
}

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Landing route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

// Route setup
app.use("/api/v1", router);
app.use("/zone", zoneRouter);

// Setup associations **before** syncing database
setupAssociations();

// Initialize Socket.IO
const server = http.createServer(app);
const io = setupSocketIO(server);
socketConfig.initialize(server);

app.get("/", (req, res) => {
  res.send("<h1>Welcome Onthego server</h1>");
});

// Sync Database with Associations
const syncDatabase = async () => {
  try {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await User.sync(); // Ensure User is synced
    await Room.sync();
    await RoomMember.sync();
    await Chat.sync();
    await Invitation.sync();
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Database synced successfully!");

    // Start server after sync
    server.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}, PID: ${process.pid}`
      );
    });
  } catch (err) {
    console.error("Database sync error:", err);
    process.exit(1);
  }
};

syncDatabase();

module.exports = { app, io };
