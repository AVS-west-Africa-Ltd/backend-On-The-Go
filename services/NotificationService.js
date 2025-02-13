const Notification = require("../models/Notification");
const socketService = require('./UserNotificationSocket').getInstance();

class NotificationService {
    static async createNotification(data) {
        const notification = await Notification.create({
            recipientId: data.recipientId,
            senderId: data.senderId,
            type: data.type,
            message: data.message,
            metadata: data.metadata
        });

        // Send real-time notification
        socketService.sendNotification(data.recipientId, {
            type: data.type,
            notification: notification,
            metadata: data.metadata
        });

        return notification;
    }

    static async createBulkNotifications(notifications) {
        const createdNotifications = await Notification.bulkCreate(notifications);

        // Group notifications by recipient for efficient socket emission
        const notificationsByRecipient = createdNotifications.reduce((acc, notification) => {
            if (!acc[notification.recipientId]) {
                acc[notification.recipientId] = [];
            }
            acc[notification.recipientId].push(notification);
            return acc;
        }, {});

        // Send real-time notifications to each recipient
        Object.entries(notificationsByRecipient).forEach(([recipientId, notifications]) => {
            socketService.sendNotification(recipientId, {
                type: 'bulk',
                notifications: notifications
            });
        });

        return createdNotifications;
    }
}

module.exports = NotificationService;
