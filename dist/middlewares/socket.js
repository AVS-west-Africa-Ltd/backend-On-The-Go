const jwt = require("jsonwebtoken");
const socket = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication token missing"));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user;
        socket.profile = decoded.profile;
        console.log(`🔐 Socket authenticated: ${''}`);
        next();
    }
    catch (err) {
        console.error("❌ Socket auth error:", err.message);
        next(new Error("Authentication failed"));
    }
};
module.exports = socket;
