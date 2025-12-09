"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Message_1 = require("../models/Message");
const chat = (io, socket) => {
    socket.on("joinRoom", ({ username, chatId }) => {
        if (!chatId)
            return;
        socket.join(chatId.toString());
        socket.to(chatId.toString()).emit("message", {
            sender: "System",
            content: `${username} joined the chat.`,
        });
    });
    socket.on("chatMessage", async ({ chatId, content }) => {
        if (!chatId || !content || !socket.profile?.id)
            return;
        try {
            // Save message to DB
            const msg = await Message_1.Message.create({
                chatId,
                senderId: socket.profile.id,
                content,
            });
            // Broadcast to everyone in room
            io.to(chatId.toString()).emit("message", {
                id: msg.id,
                sender: socket.profile.id,
                content: msg.content,
                createdAt: msg.createdAt,
            });
        }
        catch (error) {
            console.error("Error saving message:", error);
            socket.emit("error", { message: "Message delivery failed." });
        }
    });
    socket.on("leaveRoom", ({ username, chatId }) => {
        if (!chatId)
            return;
        socket.leave(chatId.toString());
        socket.to(chatId.toString()).emit("message", {
            sender: "System",
            content: `${username} left the chat.`,
        });
    });
};
exports.default = chat;
