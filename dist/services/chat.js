"use strict";
const { Message } = require("../models"); // Sequelize import
const chat = (io, socket) => {
    socket.on("joinRoom", ({ username, chatId }) => {
        if (!chatId)
            return;
        socket.join(chatId);
        socket.to(chatId).emit("message", {
            sender: "System",
            content: `${username} joined the chat.`,
        });
    });
    socket.on("chatMessage", async ({ chatId, content }) => {
        if (!chatId || !sender || !content)
            return;
        try {
            const msg = await Message.create({ chatId, senderId: socket.profile.id, content });
            io.to(chatId).emit("message", {
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
        socket.leave(chatId);
        socket.to(chatId).emit("message", {
            sender: "System",
            content: `${username} left the chat.`,
        });
    });
};
module.exports = chat;
