// routes/index.js
const express = require('express');
const multer = require('multer');
const zoneBusinessController = require('../controllers/zoneBusinessController');
const marketerController = require("../controllers/marketerTerritoryController");
const log = require('../utils/logger');

const router = express.Router();

// Error handling wrapper
const catchErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Login route
router.post('/login', zoneBusinessController.login);


router.post('/businesses', zoneBusinessController.createBusiness);

// File upload route
router.post('/upload', upload.array('files'), zoneBusinessController.uploadFiles);

// Register business route
router.post('/register/:id', zoneBusinessController.registerBusiness);

// existing multer config above
router.post('/businesses/:id/notes', upload.single('image'), zoneBusinessController.addBusinessNote);


router.post('/businesses/:id/notes', zoneBusinessController.addBusinessNote);

// Unregister business route
router.post('/unregister/:id', zoneBusinessController.unregisterBusiness);

// Get businesses route
router.get('/businesses', zoneBusinessController.getBusinesses);

// Verify business route
router.post('/verify/:id', zoneBusinessController.verifyBusiness);

// Get logs route
router.get('/logs', zoneBusinessController.getLogs);

// Marketer routes
router.post("/marketers", catchErrors(marketerController.createMarketer));
router.get("/marketers", catchErrors(marketerController.getMarketers));
router.post("/territories", catchErrors(marketerController.createTerritory));

router.get("/territories", catchErrors(marketerController.getMarketerTerritories));
router.put("/territories/:id", catchErrors(marketerController.updateTerritory));
router.patch("/territories/:id/status", catchErrors(marketerController.updateTerritoryStatus));
router.patch("/territories/:id/unassign", catchErrors(marketerController.unassignMarketer));
router.delete("/territories/:id", catchErrors(marketerController.deleteTerritory));

module.exports = router;