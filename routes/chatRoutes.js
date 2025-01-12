const express = require("express");
const chatController = require("../controllers/ChatController");
const roomController = require("../controllers/RoomController");
const invitationController = require('../controllers/InvitationController');

const router = express.Router();

// Message operations
router.post("/message/send", chatController.sendMessage);
router.get("/message/history", chatController.getMessages);
router.delete("/message/delete", chatController.deleteMessage);
router.get("/conversations", chatController.getUserConversations);
router.get("/room/:roomId/messages", chatController.getRoomMessages);

// Room operations
router.post("/room/create", roomController.createRoom);
router.post("/room/member/add", roomController.addMember);
router.delete("/room/member/remove", roomController.removeMember);
router.get("/rooms", roomController.getAllRooms);
router.get("/room/:roomId", roomController.getRoomById);
router.get("/user/:userId/rooms", roomController.getUserRooms);
router.get("/rooms/:roomId/users", roomController.getRoomUsers);

// Invitation operations
router.post("/invitation/create", invitationController.createInvitation);       // Create an invitation
router.get("/invitations", invitationController.getAllInvitations);            // Get all invitations
router.get("/invitation/:id", invitationController.getInvitationById);         // Get a single invitation
router.put("/invitation/:id", invitationController.updateInvitation);          // Update an invitation
router.delete("/invitation/:id", invitationController.deleteInvitation);       // Delete an invitation
router.get("/user/:userId/invitations", invitationController.getUserInvitations);  // New route to get all invitations for a user

module.exports = router;
