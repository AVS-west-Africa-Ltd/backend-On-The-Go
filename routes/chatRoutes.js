const express = require("express");
const chatController = require("../controllers/ChatController");
const roomController = require("../controllers/RoomController");

const router = express.Router();

// Message operations
router.post("/message/send", chatController.sendMessage);
router.get("/message/history", chatController.getMessages);
router.delete("/message/delete", chatController.deleteMessage);
router.get("/conversations", chatController.getUserConversations);
router.get("/room/:roomId/messages", chatController.getRoomMessages); // New endpoint

// Room operations
router.post("/room/create", roomController.createRoom);
router.post("/room/member/add", roomController.addMember);
router.delete("/room/member/remove", roomController.removeMember);
router.get("/rooms", roomController.getAllRooms); // New route to get all rooms
router.get("/room/:roomId", roomController.getRoomById);
router.get("/user/:userId/rooms", roomController.getUserRooms);

module.exports = router;