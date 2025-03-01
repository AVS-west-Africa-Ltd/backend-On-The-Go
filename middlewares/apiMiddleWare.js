const config = require('../config/config');

const validateApiKey = (req, res, next) => {
    const userApiKey = req.headers['x-api-key'];

    if (userApiKey && userApiKey === config.APIKEY || process.env.API_KEY  ) {
        next();
    } else {
        return res.status(403).json({ error: 'Access Denied: Unauthorized Request' });
    }
};

module.exports = validateApiKey;
