

const validateApiKey = (req, res, next) => {
    const userApiKey = req.headers['x-api-key'];

    if (userApiKey && userApiKey === process.env.API_KEY) {
        next();
    } else {
        return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }
};

module.exports = validateApiKey;
