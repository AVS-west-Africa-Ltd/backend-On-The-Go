// config/socket.js

const socketIO = require('socket.io');

class SocketService {
    constructor(server) {
        this.io = socketIO(server);
        this.userSockets = new Map(); // Maps userId to socketId
        this.initialize();
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log('New client connected');

            // Handle user authentication
            socket.on('authenticate', async (userId) => {
                this.userSockets.set(userId, socket.id);
                socket.userId = userId;
                console.log(`User ${userId} authenticated`);

                // Join a personal room for private notifications
                socket.join(`user:${userId}`);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                if (socket.userId) {
                    this.userSockets.delete(socket.userId);
                    console.log(`User ${socket.userId} disconnected`)
                }
            });
        });
    }

    // Send notification to specific user
    sendNotification(userId, notification) {
        this.io.to(`user:${userId}`).emit('notification', notification);
    }

    // Send notification to multiple users
    sendBulkNotifications(userIds, notification) {
        userIds.forEach(userId => {
            this.sendNotification(userId, notification);
        });
    }

    // Notify user about new followers
    notifyNewFollower(userId, followerData) {
        this.sendNotification(userId, {
            type: 'follow',
            data: followerData
        });
    }
}

// Initialize socket service
let socketService;
module.exports = {
    initialize: (server) => {
        socketService = new SocketService(server);
        return socketService;
    },
    getInstance: () => socketService
};



