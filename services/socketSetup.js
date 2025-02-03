const socketIo = require('socket.io');
const Chat = require('../models/Chat');
const RoomMember = require('../models/RoomMember');

const setupSocketIO = (server) => {
  console.log('🚀 Initializing Socket.IO server...');

  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'], // Allow multiple transport methods
    reconnect: true, // Enable reconnection
    reconnectionAttempts: 5, // Number of reconnection attempts
    reconnectionDelay: 1000, // Delay between reconnection attempts
  });

  console.log('✅ Socket.IO server created with CORS configuration');

  const activeUsers = new Map();
  const userSockets = new Map();

  const logAndEmitError = (socket, event, error) => {
    console.error(`❌ Error in ${event}:`, error);
    socket.emit('error', { message: error.message });
  };

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('join_user', (userId) => {
      if (!userId) {
        console.log('❌ No user ID provided for join_user');
        return;
      }

      try {
        activeUsers.set(socket.id, userId);

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        console.log(`👤 User ${userId} connected with socket ${socket.id}. Active users: ${activeUsers.size}`);

        socket.emit('user_connected', { userId, socketId: socket.id });

        // Rejoin rooms if user was previously in any rooms
        RoomMember.findAll({ where: { user_id: userId } }).then((rooms) => {
          rooms.forEach((room) => {
            socket.join(`${room.room_id}`);
            console.log(`✅ User ${userId} rejoined room ${room.room_id}`);
          });
        });
      } catch (error) {
        console.error('Error in join_user:', error);
        logAndEmitError(socket, 'join_user', error);
      }
    });

    const broadcastEvent = (event, data, logMessage) => {
      io.emit(event, data);
      console.log(`📢 ${logMessage}`, data);
    };

    socket.on('group_joined', async (data) => {
      try {
        const { room_id, user_id } = data;
        console.log(`👥 User ${user_id} joined group ${room_id}`);
        broadcastEvent('member_joined', {
          room_id,
          user_id,
          timestamp: new Date().toISOString()
        }, 'Group join broadcasted');
      } catch (error) {
        logAndEmitError(socket, 'group_joined', error);
      }
    });

    socket.on('join_room', async (data) => {
      try {
        const { room_id, user_id } = data;
        console.log(`📝 Join room request:`, data);

        const isMember = await RoomMember.findOne({ where: { room_id, user_id } });
        if (!isMember) {
          console.log(`❌ Unauthorized access by user ${user_id} to room ${room_id}`);
          return socket.emit('error', { message: 'Not authorized to join this room' });
        }

        socket.join(`${room_id}`);
        socket.emit('room_joined', { room_id });
        console.log(`✅ User ${user_id} joined room ${room_id}`);
      } catch (error) {
        logAndEmitError(socket, 'join_room', error);
      }
    });

    socket.on('send_message', async (messageData) => {
      try {
        const { room_id, sender_id, content, media_url } = messageData;

        const isMember = await RoomMember.findOne({ where: { room_id, user_id: sender_id } });
        if (!isMember) {
          console.log(`❌ Unauthorized message by user ${sender_id} in room ${room_id}`);
          return socket.emit('error', { message: 'Not authorized to send messages in this room' });
        }

        const message = await Chat.create({ room_id, sender_id, content, media_url, status: 'sent' });

        io.to(`${room_id}`).emit('new_message', {
          ...message.dataValues,
          timestamp: message.createdAt
        });

        console.log('✅ Message broadcasted:', message.id);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message. Please try again.' });
      }
    });

    const handleTyping = (event, data) => {
      const { room_id, user_id } = data;
      console.log(`⌨️ User ${user_id} ${event === 'typing_start' ? 'started' : 'stopped'} typing in room ${room_id}`);
      socket.to(`${room_id}`).emit(event === 'typing_start' ? 'user_typing' : 'user_stopped_typing', { user_id });
    };

    socket.on('typing_start', (data) => handleTyping('typing_start', data));
    socket.on('typing_end', (data) => handleTyping('typing_end', data));

    socket.on('disconnect', (reason) => {
      try {
        const userId = activeUsers.get(socket.id);

        if (userId) {
          console.log(`👋 User ${userId} disconnected, socket: ${socket.id}, reason: ${reason}`);

          const userSocketSet = userSockets.get(userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);

            if (userSocketSet.size === 0) {
              userSockets.delete(userId);
              console.log(`🚫 User ${userId} has no remaining active connections`);
            } else {
              console.log(`✅ User ${userId} still has ${userSocketSet.size} active connections`);
            }
          }

          activeUsers.delete(socket.id);
        } else {
          console.log(`👋 Unknown socket disconnected: ${socket.id}, reason: ${reason}`);
        }

        console.log(`👥 Remaining active users: ${userSockets.size}, Active sockets: ${activeUsers.size}`);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  return io;
};

module.exports = setupSocketIO;