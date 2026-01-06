import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Member } from "../models/Member";

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
};

export default chat;
