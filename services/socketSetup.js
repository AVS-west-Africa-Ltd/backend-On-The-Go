const { Server } = require('socket.io');
const Chat = require('../models/Chat');

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  // Active users map
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('authenticate', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} authenticated and joined room`);
    });

    // Modified message handling with optimistic updates
    socket.on('send_message', async (messageData) => {
      try {
        // Create a temporary message object with a temporary ID
        const tempMessage = {
          ...messageData,
          id: `temp-${Date.now()}`,
          status: 'sending',
          timestamp: new Date().toISOString()
        };

        // Immediately emit to sender for optimistic update
        socket.emit('message_optimistic', tempMessage);

        // Save message to database
        const message = await Chat.create({
          sender_id: messageData.sender_id,
          sender_type: messageData.sender_type,
          receiver_id: messageData.receiver_id,
          receiver_type: messageData.receiver_type,
          content: messageData.content,
          media_url: messageData.media_url || null,
          status: 'sent'
        });

        // Check if receiver is online
        const receiverSocketId = activeUsers.get(messageData.receiver_id);
        
        if (receiverSocketId) {
          // Send to receiver's room
          io.to(messageData.receiver_id).emit('receive_message', message);
          await message.update({ status: 'delivered' });
        }

        // Update sender with the permanent message details
        socket.emit('message_confirmed', {
          tempId: tempMessage.id,
          confirmedMessage: message
        });

      } catch (error) {
        console.error('Message sending error:', error);
        // Notify sender of failure
        socket.emit('message_failed', {
          tempId: `temp-${Date.now()}`,
          error: error.message
        });
      }
    });

    socket.on('message_read', async (messageId) => {
      try {
        const message = await Chat.findByPk(messageId);
        if (message) {
          await message.update({ status: 'read' });
          io.to(message.sender_id).emit('message_read_receipt', {
            messageId,
            receiver_id: message.receiver_id
          });
        }
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          break;
        }
      }
      console.log('Client disconnected');
    });
  });

  return io;
}

module.exports = setupSocketIO;