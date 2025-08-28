
const { developmentErrors } = require('../handlers/errorHandler');

const { Activity } = require('../models');

const activityLogger = (req, res, next) => {
  console.log("Logging Activity");
  res.on('finish', async () => {
    try {

      await Activity.create({
        userId: req.user ? req.userId : null,
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