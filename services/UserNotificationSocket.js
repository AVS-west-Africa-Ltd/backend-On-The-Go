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

// Frontend Implementation (React example)
// import React, { useEffect, useState } from 'react';
// import io from 'socket.io-client';
//
// const NotificationComponent = ({ userId }) => {
//     const [notifications, setNotifications] = useState([]);
//     const [socket, setSocket] = useState(null);
//
//     useEffect(() => {
//         // Initialize socket connection
//         const newSocket = io('http://your-server-url');
//         setSocket(newSocket);
//
//         // Authenticate user with socket
//         newSocket.emit('authenticate', userId);
//
//         // Listen for notifications
//         newSocket.on('notification', (notification) => {
//             setNotifications(prev => [notification, ...prev]);
//             // You might want to show a toast notification here
//         });
//
//         // Cleanup on unmount
//         return () => newSocket.close();
//     }, [userId]);
//
//     // Fetch existing notifications on component mount
//     useEffect(() => {
//         const fetchNotifications = async () => {
//             try {
//                 const response = await fetch(/api/notifications?userId=${userId});
//                 const data = await response.json();
//                 setNotifications(data.notifications);
//             } catch (error) {
//                 console.error('Error fetching notifications:', error);
//             }
//         };
//
//         fetchNotifications();
//     }, [userId]);
//
//     return (
//         <div className="notifications-container">
//             {notifications.map(notification => (
//                 <div key={notification.id} className="notification-item">
//                     <div className="notification-content">
//                         <img
//                             src={notification.metadata.followerPicture}
//                             alt={notification.metadata.followerUsername}
//                             className="notification-avatar"
//                         />
//                         <span className="notification-message">
//                             {notification.message}
//                         </span>
//                     </div>
//                     <span className="notification-time">
//                         {new Date(notification.createdAt).toRelativeTime()}
//                     </span>
//                 </div>
//             ))}
//         </div>
//     );
// };

