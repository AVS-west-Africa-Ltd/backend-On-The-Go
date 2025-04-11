const admin = require('firebase-admin');
const User = require('../models/User');
const PushNotification = require('../models/PushNotification');
const { catchErrors } = require('../handlers/errorHandler');
const { Op } = require('sequelize');

/**
 * Reusable function to send push notifications to users
 * @param {Object} options - Notification configuration
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Additional data payload (optional)
 * @param {Array} [options.userIds] - Specific user IDs to target (optional, sends to all if omitted)
 * @returns {Object} - Result of the notification send operation
 */
async function sendPushNotification({ title, body, data = {}, userIds = null }) {
  console.log('[PushNotification] Starting sendPushNotification', { 
    title, 
    body, 
    userIds: userIds || 'all users',
    data 
  });

  try {
    // Build query conditions
    const whereClause = {
      pushToken: { [Op.ne]: null }
    };
    
    if (userIds) {
      whereClause.id = { [Op.in]: userIds };
      console.log(`[PushNotification] Filtering for ${userIds.length} specific users`);
    } else {
      console.log('[PushNotification] No user IDs specified - targeting all users with push tokens');
    }

    // Query users
    console.log('[PushNotification] Querying users from database...');
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'pushToken', 'email', 'username']
    });

    console.log(`[PushNotification] Found ${users.length} users with push tokens`);
    if (users.length === 0) {
      console.warn('[PushNotification] Aborting: No users with push tokens found');
      return {
        success: false,
        message: 'No users with push tokens found'
      };
    }

    // Log first 3 users for debugging (avoid logging all for privacy)
    console.log('[PushNotification] Sample users (first 3):', 
      users.slice(0, 3).map(u => ({
        id: u.id,
        username: u.username,
        pushToken: u.pushToken ? `${u.pushToken.substring(0, 10)}...` : null
      }))
    );

    // Track results
    const results = [];
    let successCount = 0;

    console.log('[PushNotification] Starting notification delivery...');
    for (const [index, user] of users.entries()) {
      const message = {
        notification: { title, body },
        data,
        token: user.pushToken
      };

      console.log(`[PushNotification] Sending to user ${index + 1}/${users.length} (ID: ${user.id})`);
      
      try {
        const sendResult = await admin.messaging().send(message);
        console.log(`[PushNotification] Success for user ${user.id}`, {
          messageId: sendResult, 
          username: user.username
        });
        
        successCount++;
        results.push({
          userId: user.id,
          status: 'success',
          messageId: sendResult
        });
      } catch (error) {
        console.error(`[PushNotification] Failed for user ${user.id}:`, {
          error: error.message,
          code: error.code,
          username: user.username
        });
        
        results.push({
          userId: user.id,
          status: 'failed',
          error: {
            message: error.message,
            code: error.code
          }
        });
      }
    }

    const summary = {
      totalRecipients: users.length,
      successCount,
      failureCount: users.length - successCount,
      successRate: `${Math.round((successCount / users.length) * 100)}%`
    };

    console.log('[PushNotification] Delivery complete', summary);
    console.log('[PushNotification] Sample results (first 5):', results.slice(0, 5));

    return {
      success: true,
      ...summary,
      results
    };

  } catch (error) {
    console.error('[PushNotification] Critical error:', {
      error: error.message,
      stack: error.stack,
      inputParams: { title, body, userIds }
    });
    
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    };
  }
}

// Original controller (now uses the reusable function)
exports.sendNotificationToAllUsers = catchErrors(async (req, res) => {
  const { title, body, data } = req.body;

  // Use the reusable function
  const result = await sendPushNotification({ title, body, data });

  if (!result.success) {
    return res.status(400).json(result);
  }

  // Optional: Log to PushNotification model (as in original code)
  await PushNotification.create({
    title,
    body,
    data,
    recipientsCount: result.totalRecipients,
    successCount: result.successCount,
    failureCount: result.failureCount,
    status: 'sent'
  });

  res.status(200).json({
    success: true,
    message: 'Notifications processed',
    data: result
  });
});

/**
 * Send room-specific push notification to targeted users
 * @param {Object} options - Notification configuration
 * @param {string} options.senderId - ID of the user triggering the action
 * @param {Array} options.receiverIds - Array of user IDs to receive the notification
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Additional data payload (optional)
 * @param {string} [options.roomId] - Associated room ID (optional)
 * @returns {Object} - Result of the notification send operation
 */
async function sendRoomNotification({ senderId, receiverIds, title, body, data = {}, roomId = null }) {
  if (!receiverIds || receiverIds.length === 0) {
    console.log('[PushNotification] No receiverIds specified - skipping room notification');
    return {
      success: false,
      message: 'No receivers specified'
    };
  }

  // Enhance data payload with room context
  const enhancedData = {
    ...data,
    type: 'room_notification',
    senderId,
    timestamp: new Date().toISOString()
  };

  if (roomId) {
    enhancedData.roomId = roomId;
  }

  // Get sender info for the notification
  let senderInfo = {};
  try {
    const sender = await User.findByPk(senderId, {
      attributes: ['username', 'firstName', 'lastName', 'picture']
    });
    if (sender) {
      senderInfo = {
        senderName: sender.username || `${sender.firstName} ${sender.lastName}`.trim(),
        senderAvatar: sender.picture
      };
    }
  } catch (error) {
    console.error('[PushNotification] Error fetching sender info:', error);
  }

  return sendPushNotification({
    title,
    body,
    data: {
      ...enhancedData,
      ...senderInfo
    },
    userIds: receiverIds
  });
}


/**
 * Send chat-specific push notification
 * @param {Object} options - Notification configuration
 * @param {string} options.senderId - ID of the message sender
 * @param {Array} options.recipientIds - Array of user IDs to receive the notification
 * @param {string} options.roomId - Room ID where the message was sent
 * @param {string} [options.message] - The message content (optional)
 * @param {string} [options.mediaType] - Type of media if message has attachment (optional)
 * @param {Object} [options.customData] - Additional custom data (optional)
 * @returns {Object} - Result of the notification send operation
 */
async function sendChatNotification({ senderId, recipientIds, roomId, message = null, mediaType = null, customData = {} }) {
  console.log('[PushNotification] Preparing chat notification', { 
    senderId, 
    recipientIds, 
    roomId 
  });

  try {
    // Get sender info
    const sender = await User.findByPk(senderId, {
      attributes: ['username', 'firstName', 'lastName', 'picture']
    });

    if (!sender) {
      console.error('[PushNotification] Sender not found');
      return {
        success: false,
        message: 'Sender not found'
      };
    }

    const senderName = sender.username || `${sender.firstName} ${sender.lastName}`.trim();
    const isMediaMessage = mediaType !== null;

    // Prepare notification content
    const title = `New message from ${senderName}`;
    let body = isMediaMessage 
      ? `${senderName} sent a ${mediaType} file` 
      : (message ? message.substring(0, 100) : 'New message');

    // Prepare data payload
    const data = {
      ...customData,
      type: 'chat_message',
      senderId,
      senderName,
      senderAvatar: sender.picture || '',
      roomId,
      timestamp: new Date().toISOString(),
      isMediaMessage,
      mediaType: mediaType || ''
    };

    // Send notification to recipients
    return await sendPushNotification({
      title,
      body,
      data,
      userIds: recipientIds
    });

  } catch (error) {
    console.error('[PushNotification] Error in sendChatNotification:', {
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message
    };
  }
}

// Add to exports
module.exports = {
  ...exports,
  sendPushNotification,
  sendRoomNotification,
  sendChatNotification
};
