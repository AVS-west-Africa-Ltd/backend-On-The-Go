"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
const chat_service_1 = __importDefault(require("../services/chat.service"));
const socket_1 = __importDefault(require("../middlewares/socket"));
const setupSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.use(socket_1.default);
    const services = [chat_service_1.default];
    io.on("connection", (socket) => {
        console.log("SOCKET_CONNECTED:", socket.id);
        // Initialize all socket services
        services.forEach((service) => service(io, socket));
        socket.on("disconnect", () => {
            console.log("SOCKET_DISCONNECTED:", socket.id);
        });
    });
    return io;
};
exports.setupSocket = setupSocket;
exports.default = exports.setupSocket;
