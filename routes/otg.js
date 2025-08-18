const express = require('express');
const ctrl = require('../controllers/WifiSpotController');
const validateApiKey = require('../middlewares/apiMiddleWare'); // already exists in your project

const router = express.Router();

// If X-API-KEY is set in env, enforce it; otherwise allow through in dev
const maybeKey = process.env.X_API_KEY ? validateApiKey : (_req, _res, next) => next();

router.post('/wifi-spots', maybeKey, ctrl.create);
router.get('/wifi-spots/count', ctrl.count);
router.get('/wifi-spots', ctrl.list);
router.get('/wifi-spots/near', ctrl.near);

module.exports = router; 