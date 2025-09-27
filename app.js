require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routes");
const path = require("path");
const morgan = require("morgan");
const admin = require('firebase-admin');

// Import models
const db = require('./models');

// Add Swagger imports
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

require("./cron/DeleteUserCron");

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const app = express();



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

//app.use(validateApiKey);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Use compression middleware
app.use(compression());


// Landing route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

app.use("/api/v1", router);


server.listen(PORT, HOST, () => {
  console.log(
    `Server running on http://localhost:${PORT}, PID: ${process.pid}`
  );
});

module.exports = { app };
