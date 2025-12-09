import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";

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
}

interface LeaveRoomPayload {
  username: string;
  chatId: string | number;
}

const chat = (io: Server, socket: AuthenticatedSocket) => {
  
  socket.on("joinRoom", ({ username, chatId }: JoinRoomPayload) => {
    if (!chatId) return;

    socket.join(chatId.toString());

    socket.to(chatId.toString()).emit("message", {
      sender: "System",
      content: `${username} joined the chat.`,
    });
  });

  socket.on("chatMessage", async ({ chatId, content }: ChatMessagePayload) => {
    if (!chatId || !content || !socket.profile?.id) return;

    try {
      // Save message to DB
      const msg = await Message.create({
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
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("error", { message: "Message delivery failed." });
    }
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
