const { Server } = require('socket.io');
const Chat = require('../models/Chat');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  // Active users and room connections tracking
  const activeUsers = new Map();
  const userRooms = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected');

    // User authentication and room joining
    socket.on('authenticate', async (userData) => {
      const { userId, rooms } = userData;
      
      // Store active user's socket
      activeUsers.set(userId, socket.id);
      
      // Join user's personal room and all their room rooms
      socket.join(userId);
      
      if (rooms && rooms.length) {
        rooms.forEach(roomId => {
          socket.join(`room-${roomId}`);
          
          // Track user's rooms
          if (!userRooms.has(userId)) {
            userRooms.set(userId, new Set());
          }
          userRooms.get(userId).add(roomId);
        });
      }
      
      console.log(`User ${userId} authenticated and joined rooms`);
    });

    // Enhanced message sending with robust error handling
    socket.on('send_message', async (messageData) => {
      try {
        const { room_id, sender_id, content, media_url } = messageData;

        // Verify sender is a member of the room
        const isMember = await RoomMember.findOne({
          where: { room_id, user_id: sender_id }
        });

        if (!isMember) {
          socket.emit('message_error', {
            message: "Not a member of this room",
            status: 403
          });
          return;
        }

        // Create message with optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
          ...messageData,
          id: tempId,
          status: 'sending',
          timestamp: new Date().toISOString()
        };

        // Emit optimistic message immediately to sender
        socket.emit('message_optimistic', optimisticMessage);

        // Save message to database
        const message = await Chat.create({
          room_id,
          sender_id,
          content,
          media_url,
          status: 'sent'
        });

        // Broadcast to all members in the room
        io.to(`room-${room_id}`).emit('receive_message', message);

        // Confirm message to sender with permanent ID
        socket.emit('message_confirmed', {
          tempId: tempId,
          confirmedMessage: message
        });

        // Update room's last activity
        await Room.update(
          { updatedAt: new Date() },
          { where: { id: room_id } }
        );

      } catch (error) {
        console.error('Message sending error:', error);
        socket.emit('message_error', {
          message: error.message,
          status: 500
        });
      }
    });

    // Message read receipt
    socket.on('message_read', async (readData) => {
      const { messageId, userId } = readData;
      try {
        const message = await Chat.findByPk(messageId);
        if (message) {
          await message.update({ status: 'read' });
          
          // Notify sender about read receipt
          io.to(message.sender_id).emit('message_read_receipt', {
            messageId,
            reader_id: userId,
            room_id: message.room_id
          });
        }
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // Room join/leave events
    socket.on('join_room', async (roomData) => {
      const { roomId, userId } = roomData;
      socket.join(`room-${roomId}`);
      
      // Optional: Broadcast to room members
      io.to(`room-${roomId}`).emit('user_joined', { userId, roomId });
    });

    socket.on('leave_room', async (roomData) => {
      const { roomId, userId } = roomData;
      socket.leave(`room-${roomId}`);
      
      // Optional: Broadcast to room members
      io.to(`room-${roomId}`).emit('user_left', { userId, roomId });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          // Remove from active users
          activeUsers.delete(userId);
          
          // Optional: Remove tracked rooms
          if (userRooms.has(userId)) {
            userRooms.delete(userId);
          }
          break;
        }
      }
      console.log('Client disconnected');
    });
  });

  return io;
}

module.exports = setupSocketIO;