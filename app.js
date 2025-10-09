require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routes");
const path = require("path");
const admin = require('firebase-admin');

// Import models
const db = require('./models');

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


// Landing route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "landing.html"));
});

app.post("/query", async (req, res) => {
  try {
    const { sql } = req.body;

    const [results] = await db.sequelize.query(sql);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/sync_db", async (req, res)=>{
  try {
    const { model } = req.body;
    await db.sequelize.query('SET unique_checks = 0;');
    await db.sequelize.query('SET foreign_key_checks = 0;');
    db[model].sync({ alter: true })
      .then(async () => {
        await db.sequelize.query('SET unique_checks = 1;');
        await db.sequelize.query('SET foreign_key_checks = 1;');
        res.json({ success: true,});
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  
});

app.use("/api/v1", router);


app.listen(PORT, HOST, () => {
  console.log(
    `Server running on http://localhost:${PORT}, PID: ${process.pid}`
  );
});

module.exports = { app };
