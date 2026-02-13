import { Server, Socket } from "socket.io";
import { Message } from "../models/message.model";
import { Member } from "../models/member.model";
import { Op } from "sequelize";

// Extend socket type to include authenticated user info
interface AuthenticatedSocket extends Socket {
  profile?: { id: number; username?: string };
}

interface JoinRoomPayload {
  username: string;
  chatId: string;
}

interface ChatMessagePayload {
  chatId: string;
  content: string;
  media?: string[];
}

interface LeaveRoomPayload {
  username: string;
  chatId: string | number;
}

const chat = (io: Server, socket: AuthenticatedSocket) => {

  // Helper to verify membership
  const verifyMembership = async (chatId: string, profileId: number) => {
    const member = await Member.findOne({
      where: {
        targetId: chatId,
        profileId,
        memberType: "chat",
      },
    });
    return !!member;
  };

  socket.on("joinRoom", async ({ username, chatId }: JoinRoomPayload) => {
    if (!chatId || !socket.profile?.id) return;

    try {
      const isMember = await verifyMembership(chatId, socket.profile.id);
      if (!isMember) {
        socket.emit("error", { message: "Access denied. You are not a member of this chat." });
        return;
      }

      socket.join(chatId.toString());

      socket.to(chatId.toString()).emit("message", {
        sender: "System",
        content: `${username} joined the chat.`,
      });

      // console.log(`${username} joined room ${chatId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", { message: "Failed to join room." });
    }
  });

  socket.on("chatMessage", async ({ chatId, content, media }: ChatMessagePayload) => {
    if (!chatId || (!content && !media) || !socket.profile?.id) return;

    try {
      const isMember = await verifyMembership(chatId, socket.profile.id);
      if (!isMember) {
        socket.emit("error", { message: "Unauthorized. You are not a member of this chat." });
        return;
      }

      // Save message to DB
      const msg = await Message.create({
        chatId,
        senderId: socket.profile.id,
        content: content || "",
        media: (media as any) || null,
      });

      // Broadcast to everyone in room including sender (to confirm receipt/ordering)
      io.to(chatId.toString()).emit("message", {
        id: msg.id,
        sender: socket.profile.id, // sending ID is often better for frontend matching
        content: msg.content,
        media: msg.media,
        createdAt: msg.createdAt,
      });
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("error", { message: "Message delivery failed." });
    }
  });

  socket.on("typing", ({ chatId }: { chatId: string }) => {
    if (!chatId || !socket.profile) return;
    socket.to(chatId.toString()).emit("typing", {
      userId: socket.profile.id,
      username: socket.profile.username // Optional: if available in profile
    });
  });

  socket.on("stopTyping", ({ chatId }: { chatId: string }) => {
    if (!chatId || !socket.profile) return;
    socket.to(chatId.toString()).emit("stopTyping", {
      userId: socket.profile.id,
    });
  });

  // Simple read receipt event (just relaying for now)
  socket.on("markAsRead", ({ chatId, messageId }: { chatId: string; messageId: string }) => {
    if (!chatId || !socket.profile) return;
    // In future: Update DB here
    socket.to(chatId.toString()).emit("messageRead", {
      userId: socket.profile.id,
      messageId
    });
  });

  socket.on("leaveRoom", ({ username, chatId }: LeaveRoomPayload) => {
    if (!chatId) return;

    socket.leave(chatId.toString());

    socket.to(chatId.toString()).emit("message", {
      sender: "System",
      content: `${username} left the chat.`,
    });
  });

  // NEW: Fetch all active chats for the user
  socket.on("fetchChats", async () => {
    if (!socket.profile?.id) return;
    try {
      const { Chat } = require("../models/Chat");
      const { Profile } = require("../models/Profile");
      const { Message } = require("../models/Message");

      // Find all chats where user is a member
      const memberships = await Member.findAll({
        where: { profileId: socket.profile.id, memberType: "chat" },
        include: [{
          model: Chat,
          as: "chat", // Ensure alias matches model definition
          include: [
            {
              model: Message,
              as: "messages",
              limit: 1,
              order: [['createdAt', 'DESC']]
            }
          ]
        }]
      });

      // Format response
      const chats = await Promise.all(memberships.map(async (m: any) => {
        const chat = m.chat;
        // Find peer member for context (assuming 1-on-1 for now, or just list members)
        const otherMembers = await Member.findAll({
          where: { targetId: chat.id, memberType: "chat", profileId: { [Op.ne]: socket.profile!.id } },
          include: [{ model: Profile, as: "profile", attributes: ['id', 'userName', 'picture'] }]
        });

        return {
          id: chat.id,
          name: chat.name, // or derive from peers
          lastMessage: chat.messages?.[0] || null,
          peers: otherMembers.map((om: any) => om.profile)
        };
      }));

      socket.emit("chatList", chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      socket.emit("error", { message: "Failed to fetch chats." });
    }
  });

  // NEW: Fetch chat history
  socket.on("fetchHistory", async ({ chatId, page = 1, limit = 20 }: { chatId: string, page?: number, limit?: number }) => {
    if (!chatId || !socket.profile?.id) return;
    try {
      const isMember = await verifyMembership(chatId, socket.profile.id);
      if (!isMember) {
        socket.emit("error", { message: "Access denied." });
        return;
      }

      const offset = (page - 1) * limit;
      const messages = await Message.findAll({
        where: { chatId },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      socket.emit("chatHistory", {
        chatId,
        messages: messages.reverse(), // Send oldest first suitable for UI
        page
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      socket.emit("error", { message: "Failed to fetch history." });
    }
  });
};

export default chat;
