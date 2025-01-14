const socketIo = require('socket.io');
const Chat = require('../models/Chat');
const RoomMember = require('../models/RoomMember');

const setupSocketIO = (server) => {
  console.log('🚀 Initializing Socket.IO server...');

  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  console.log('✅ Socket.IO server created with CORS configuration');

  const activeUsers = new Map();

  const logAndEmitError = (socket, event, error) => {
    console.error(`❌ Error in ${event}:`, error);
    socket.emit('error', { message: error.message });
  };

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle user joining
    socket.on('join_user', (userId) => {
      activeUsers.set(socket.id, userId);
      console.log(`👤 User ${userId} connected. Active users: ${activeUsers.size}`);
    });

    // Broadcast helper
    const broadcastEvent = (event, data, logMessage) => {
      io.emit(event, data);
      console.log(`📢 ${logMessage}`, data);
    };

    // Group join event
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

    // Room join event
    socket.on('room_joined', async (data) => {
      try {
        const { room_id, user_id } = data;
        console.log(`👥 User ${user_id} joined room ${room_id}`);
        broadcastEvent('room_updated', { room_id, user_id, action: 'joined', timestamp: new Date().toISOString() }, 'Room join broadcasted');
        io.emit(`user_${user_id}_rooms_updated`, { room_id, action: 'joined', timestamp: new Date().toISOString() });
      } catch (error) {
        logAndEmitError(socket, 'room_joined', error);
      }
    });

    // Handle joining a room
    socket.on('join_room', async (data) => {
      try {
        const { room_id, user_id } = data;
        console.log(`📝 Join room request:`, data);

        const isMember = await RoomMember.findOne({ where: { room_id, user_id } });
        if (!isMember) {
          console.log(`❌ Unauthorized access by user ${user_id} to room ${room_id}`);
          return socket.emit('error', { message: 'Not authorized to join this room' });
        }

        socket.join(`room_${room_id}`);
        socket.emit('room_joined', { room_id });
        console.log(`✅ User ${user_id} joined room ${room_id}`);
      } catch (error) {
        logAndEmitError(socket, 'join_room', error);
      }
    });

    // Handle sending messages
    socket.on('send_message', async (messageData) => {
      try {
        const { room_id, sender_id, content, media_url } = messageData;
        console.log('📨 New message:', { room_id, sender_id });

        const isMember = await RoomMember.findOne({ where: { room_id, user_id: sender_id } });
        if (!isMember) {
          console.log(`❌ Unauthorized message by user ${sender_id} in room ${room_id}`);
          return socket.emit('error', { message: 'Not authorized to send messages in this room' });
        }

        const message = await Chat.create({ room_id, sender_id, content, media_url, status: 'sent' });
        io.to(`room_${room_id}`).emit('new_message', { ...message.dataValues, timestamp: message.createdAt });
        console.log('✅ Message broadcasted:', message.id);
      } catch (error) {
        logAndEmitError(socket, 'send_message', error);
      }
    });

    // Handle typing status
    const handleTyping = (event, data) => {
      const { room_id, user_id } = data;
      console.log(`⌨️ User ${user_id} ${event === 'typing_start' ? 'started' : 'stopped'} typing in room ${room_id}`);
      socket.to(`room_${room_id}`).emit(event === 'typing_start' ? 'user_typing' : 'user_stopped_typing', { user_id });
    };

    socket.on('typing_start', (data) => handleTyping('typing_start', data));
    socket.on('typing_end', (data) => handleTyping('typing_end', data));

    // Handle message read
    socket.on('message_read', async (data) => {
      try {
        const { message_id, room_id, user_id } = data;
        console.log('👁️ Message read:', data);

        await Chat.update({ status: 'read' }, { where: { id: message_id } });
        io.to(`room_${room_id}`).emit('message_status_update', { message_id, status: 'read', read_by: user_id });
        console.log('✅ Read status broadcasted for message:', message_id);
      } catch (error) {
        logAndEmitError(socket, 'message_read', error);
      }
    });

    // Handle group leave
    socket.on('group_left', (data) => {
      io.emit('group_left', {
        room_id: data.room_id,
        user_id: data.user_id,
        timestamp: data.timestamp,
        type: data.type
      });
    });

    // Handle leaving a room
    socket.on('leave_room', async (data) => {
      try {
        const { room_id, user_id } = data;
        console.log(`🚪 Leave room request:`, data);

        const isMember = await RoomMember.findOne({ where: { room_id, user_id } });
        if (!isMember) {
          console.log(`❌ Unauthorized access by user ${user_id} to leave room ${room_id}`);
          return socket.emit('error', { message: 'Not authorized to leave this room' });
        }

        socket.leave(`room_${room_id}`);
        socket.emit('room_left', { room_id });
        console.log(`✅ User ${user_id} left room ${room_id}`);
        io.to(`room_${room_id}`).emit('room_updated', { room_id, user_id, action: 'left', timestamp: new Date().toISOString() });
      } catch (error) {
        logAndEmitError(socket, 'leave_room', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = activeUsers.get(socket.id);
      if (userId) {
        console.log(`👋 User ${userId} disconnected`);
        activeUsers.delete(socket.id);
      } else {
        console.log('👋 Unknown user disconnected:', socket.id);
      }
      console.log('👥 Remaining active users:', activeUsers.size);
    });
  });

  return io;
};

module.exports = setupSocketIO;
