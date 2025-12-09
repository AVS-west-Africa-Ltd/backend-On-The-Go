"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const fs_1 = __importDefault(require("fs"));
const log = (message, username = 'SYSTEM', userId = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [User: ${username} with ID: ${userId}] ${message}\n`;
    // Append to file
    fs_1.default.appendFileSync('server.log', logMessage);
    // Print to console
    console.log(logMessage);
};
exports.log = log;
