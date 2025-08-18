const { Activity } = require('../models');

const activityLogger = (req, res, next) => {
  res.on('finish', async () => {
    try {
      await Activity.create({
        userId: req.user ? req.user._id : null,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  });

  next();
};

module.exports = activityLogger;