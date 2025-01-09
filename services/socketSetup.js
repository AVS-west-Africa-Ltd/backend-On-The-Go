// services/socketSetup.js

const socketIo = require('socket.io');
const Chat = require('../models/Chat');
const RoomMember = require('../models/RoomMember');

const setupSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store active users
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user joining
    socket.on('join_user', (userId) => {
      activeUsers.set(socket.id, userId);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // Handle joining a room
    socket.on('join_room', async (data) => {
      const { room_id, user_id } = data;
      
      try {
        // Verify user is a member of the room
        const isMember = await RoomMember.findOne({
          where: { room_id, user_id }
        });

        if (isMember) {
          socket.join(`room_${room_id}`);
          socket.emit('room_joined', { room_id });
          console.log(`User ${user_id} joined room ${room_id}`);
        } else {
          socket.emit('error', { message: 'Not authorized to join this room' });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle new message
    socket.on('send_message', async (messageData) => {
      const { room_id, sender_id, content, media_url } = messageData;
      
      try {
        // Verify sender is a member of the room
        const isMember = await RoomMember.findOne({
          where: { room_id, user_id: sender_id }
        });

        if (!isMember) {
          socket.emit('error', { message: 'Not authorized to send messages in this room' });
          return;
        }

        // Save message to database
        const message = await Chat.create({
          room_id,
          sender_id,
          content,
          media_url,
          status: 'sent'
        });

        // Broadcast message to room
        io.to(`room_${room_id}`).emit('new_message', {
          id: message.id,
          room_id,
          sender_id,
          content,
          media_url,
          status: 'sent',
          timestamp: message.createdAt
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing status
    socket.on('typing_start', (data) => {
      const { room_id, user_id } = data;
      socket.to(`room_${room_id}`).emit('user_typing', { user_id });
    });

    socket.on('typing_end', (data) => {
      const { room_id, user_id } = data;
      socket.to(`room_${room_id}`).emit('user_stopped_typing', { user_id });
    });

    // Handle read receipts
    socket.on('message_read', async (data) => {
      const { message_id, room_id, user_id } = data;
      
      try {
        await Chat.update(
          { status: 'read' },
          { where: { id: message_id } }
        );

        io.to(`room_${room_id}`).emit('message_status_update', {
          message_id,
          status: 'read',
          read_by: user_id
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = activeUsers.get(socket.id);
      if (userId) {
        console.log(`User ${userId} disconnected`);
        activeUsers.delete(socket.id);
      }
    });
  });

  return io;
};

module.exports = setupSocketIO;