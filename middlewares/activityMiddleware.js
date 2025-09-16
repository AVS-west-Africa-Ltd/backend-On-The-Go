// middlewares/activityMiddleware.js
const { Activity } = require('../models'); // use the models index, not ../models/Activity

function clamp(s, n) {
  if (s == null) return null;
  return String(s).slice(0, n);
}

module.exports = (req, res, next) => {
  res.on('finish', async () => {
    try {
      if (!Activity || typeof Activity.create !== 'function') return;

      // current DB sizes: url/userAgent 255, method 8, ip 45
      await Activity.create({
        userId: Number.isFinite(Number(req.user?.id ?? req.user?._id))
          ? Number(req.user?.id ?? req.user?._id)
          : null,
        url: clamp(req.originalUrl, 255),
        method: clamp(req.method, 8),
        ip: clamp(req.ip, 45),
        userAgent: clamp(req.headers['user-agent'], 255),
        statusCode: res.statusCode,
      });
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  });

  next();
};
