// routes/otg.js
const express = require('express');
const multer = require('multer');
const validateApiKey = require('../middlewares/apiMiddleWare'); // existing in your project
const ctrl = require('../controllers/WifiSpotController');

const router = express.Router();

// If X-API-KEY is set, enforce it; otherwise allow through in dev
const maybeKey = process.env.X_API_KEY ? validateApiKey : (_req, _res, next) => next();

// Multer: memory storage for JSON file uploads
const uploadJson = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json')) cb(null, true);
    else cb(new Error('Only .json files are allowed'));
  },
});

// Create
router.post('/wifi-spots', maybeKey, ctrl.create);

// Read (single)
router.get('/wifi-spots/:id', maybeKey, ctrl.getById);

// Read (list)
router.get('/wifi-spots', maybeKey, ctrl.list);

// Update
router.put('/wifi-spots/:id', maybeKey, ctrl.update);
router.patch('/wifi-spots/:id', maybeKey, ctrl.update);

// Delete
router.delete('/wifi-spots/:id', maybeKey, ctrl.remove);

// Count
router.get('/wifi-spots/count', maybeKey, ctrl.count);

// Nearby
router.get('/wifi-spots/near', maybeKey, ctrl.near);

// Bulk upload from JSON body
router.post('/wifi-spots/bulk-upload', maybeKey, ctrl.bulkUpload);

// Bulk upload from JSON file (multipart/form-data; field: jsonFile)
router.post('/wifi-spots/upload-json', maybeKey, uploadJson.single('jsonFile'), ctrl.bulkUploadFile);

// Export to viewer JSON shape
router.get('/wifi-spots/export', maybeKey, ctrl.export);

module.exports = router;
