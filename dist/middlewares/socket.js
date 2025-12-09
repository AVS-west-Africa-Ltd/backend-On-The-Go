"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.toString().split(" ")[1];
        if (!token) {
            return next(new Error("Authentication token missing"));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user;
        socket.profile = decoded.profile;
        console.log(`🔐 Socket authenticated: ${socket.user?.id || "unknown user"}`);
        next();
    }
    catch (err) {
        console.error("❌ Socket auth error:", err.message);
        next(new Error("Authentication failed"));
    }
};
exports.default = socketAuth;
