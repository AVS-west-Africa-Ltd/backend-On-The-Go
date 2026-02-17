import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import http from "http";
import setupSocket from "./config/socket";
import admin from "firebase-admin";
import db from "./models";
import { connectDB } from "./config/database";
import router from "./routes";
import { initInsightCron } from "./cron/insight.cron";
import webhookRoutes from "./routes/webhook.routes";
import { seedAmenities } from "./scripts/seedAmenities";
import { registerWebhookListeners } from "./subscribers/webhook.subscriber";
import { registerStaffListeners } from "./subscribers/staff.subscriber";
import { registerRewardListeners } from "./subscribers/reward.subscriber";
import { verifyPendingTransactionsCron } from "./schedulers/update-transactions.scheduler";

const serviceAccount = require('../global/serviceAccountKey.json');

// Register Event Listeners
registerWebhookListeners();
registerStaffListeners();
registerRewardListeners();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = '0.0.0.0';
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: "*", // allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  // allowedHeaders: ["Content-Type", "Authorization"], // removed to allow all headers
}));


// app.use(validateApiKey);

app.use("/webhooks", express.raw({ type: 'application/json' }), webhookRoutes);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

const publicPath = isProduction
  ? path.join(__dirname, "public")      // dist/public
  : path.join(__dirname, "../public");  // src/../public

app.use("/uploads", express.static(publicPath));

// Landing route
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "landing.html"));
});


app.post("/query", async (req, res) => {
  try {
    const { sql } = req.body;

    const [results] = await db.sequelize.query(sql);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/sync_db", async (req: express.Request, res: express.Response) => {
  try {
    const { model } = req.body;
    await db.sequelize.query('SET unique_checks = 0;');
    await db.sequelize.query('SET foreign_key_checks = 0;');
    db[model].sync({ alter: true })
      .then(async () => {
        await db.sequelize.query('SET unique_checks = 1;');
        await db.sequelize.query('SET foreign_key_checks = 1;');
        res.json({ success: true, });
      })
      .catch((err: any) => {
        res.status(500).json({ error: err.message });
      });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }

});

app.get("/api/v1", (req, res) => {
  res.status(200).json({ success: true, message: "Welcome to On The Go API v1" });
});

app.use("/api/v1", router);


setupSocket(server);

async function startServer() {
  try {
    // console.log('?????????');

    await connectDB();
    console.log("Database connected successfully.");

    // Seed Amenities on startup
    await seedAmenities();

    // Start Schedulers
    verifyPendingTransactionsCron();

    server.listen(PORT, HOST, () => {
      console.log(`Server running on http://localhost:${PORT}, PID: ${process.pid}`);
      initInsightCron();
    });
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1); // exit if DB fails
  }
}

startServer();


export default app;
