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

      console.log(`[PushNotification] Sending to user ${index + 1}/${users.length} (ID: ${user.id}, Email: ${user.email})`);
      
      try {
        const sendResult = await admin.messaging().send(message);
        console.log(`[PushNotification] Success for user ${user.id}`, {
          messageId: sendResult, 
          username: user.username,
          email: user.email
        });
        
        successCount++;
        results.push({
          userId: user.id,
          email: user.email,
          status: 'success',
          messageId: sendResult
        });
      } catch (error) {
        console.error(`[PushNotification] Failed for user ${user.id}:`, {
          error: error.message,
          code: error.code,
          username: user.username,
          email: user.email
        });
        
        results.push({
          userId: user.id,
          email: user.email,
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
    console.log('[PushNotification] Results summary:', {
      successful: results.filter(r => r.status === 'success').map(r => ({ userId: r.userId, email: r.email })),
      failed: results.filter(r => r.status === 'failed').map(r => ({ userId: r.userId, email: r.email }))
    });

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
exports.sendRoomNotification = async function({ senderId, receiverIds, title, body, data = {}, roomId = null }) {
  console.log('[PushNotification] Starting room notification', {
    senderId,
    receiverIds,
    roomId
  });

  // Validate required parameters
  if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
    console.log('[PushNotification] No receiverIds specified or invalid format - skipping room notification');
    return {
      success: false,
      message: 'No receivers specified or invalid receivers format'
    };
  }

  if (!title || !body) {
    console.log('[PushNotification] Missing required parameters (title or body) - skipping room notification');
    return {
      success: false, 
      message: 'Missing required parameters'
    };
  }

  // Enhance data payload with room context
  const enhancedData = {
    ...data,
    type: 'room_notification',
    senderId: senderId ? String(senderId) : '',
    timestamp: new Date().toISOString()
  };

  if (roomId) {
    enhancedData.roomId = String(roomId);
  }

  // Get sender info for the notification if senderId is provided
  let senderInfo = {};
  if (senderId) {
    try {
      const sender = await User.findByPk(senderId, {
        attributes: ['username', 'firstName', 'lastName', 'picture']
      });
      if (sender) {
        senderInfo = {
          senderName: sender.username || `${sender.firstName} ${sender.lastName}`.trim(),
          senderAvatar: sender.picture || ''
        };
        console.log('[PushNotification] Sender info:', senderInfo);
      }
    } catch (error) {
      console.error('[PushNotification] Error fetching sender info:', error);
    }
  }

  // Make sure all receiverIds are strings
  const validReceiverIds = receiverIds.filter(id => id).map(id => String(id));
  
  // Call the base notification function
  return sendPushNotification({
    title,
    body,
    data: {
      ...enhancedData,
      ...senderInfo
    },
    userIds: validReceiverIds
  });
};

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
exports.sendChatNotification = async function({
  senderId,
  recipientIds,
  roomId,
  message = null,
  mediaType = null,
  customData = {}
}) {
  console.log('[PushNotification] Preparing chat notification', { 
    senderId, 
    recipientIds, 
    roomId,
    hasMessage: !!message,
    mediaType
  });

  try {
    // Validate required parameters
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      console.log('[PushNotification] No recipientIds specified or invalid format - skipping chat notification');
      return {
        success: false,
        message: 'No recipients specified or invalid recipients format'
      };
    }

    if (!senderId || !roomId) {
      console.log('[PushNotification] Missing required parameters (senderId or roomId) - skipping chat notification');
      return {
        success: false,
        message: 'Missing required parameters'
      };
    }

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

    console.log('[PushNotification] Notification content:', { title, body });

    // Prepare data payload with all values as strings
    const data = {
      ...Object.entries(customData).reduce((acc, [key, val]) => {
        acc[key] = String(val);
        return acc;
      }, {}),
      type: 'chat_message',
      senderId: String(senderId),
      senderName: String(senderName),
      senderAvatar: sender.picture || '',
      roomId: String(roomId),
      timestamp: new Date().toISOString(),
      isMediaMessage: isMediaMessage ? 'true' : 'false',
      mediaType: mediaType ? String(mediaType) : ''
    };

    // Make sure all recipientIds are strings
    const validRecipientIds = recipientIds.filter(id => id).map(id => String(id));

    // Send notification to recipients
    return await sendPushNotification({
      title,
      body,
      data,
      userIds: validRecipientIds
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
};


/**
 * Send post creation push notification to followers
 * @param {Object} options - Notification configuration
 * @param {string} options.posterId - ID of the user who created the post
 * @param {Array} options.followerIds - Array of follower user IDs to notify
 * @param {string} options.postDescription - Description/content of the post
 * @param {string} [options.postId] - ID of the created post (optional)
 * @param {string} [options.postType] - Type of post (optional)
 * @param {Object} [options.customData] - Additional custom data (optional)
 * @returns {Object} - Result of the notification send operation
 */
exports.sendPostNotification = async function({
  posterId,
  followerIds,
  postDescription,
  postId = null,
  postType = null,
  customData = {}
}) {
  console.log('[PushNotification] Preparing post notification', { 
    posterId, 
    followerCount: followerIds.length,
    hasDescription: !!postDescription,
    postType
  });

  try {
    // Validate required parameters
    if (!followerIds || !Array.isArray(followerIds) || followerIds.length === 0) {
      console.log('[PushNotification] No followerIds specified or invalid format - skipping post notification');
      return {
        success: false,
        message: 'No followers specified or invalid followers format'
      };
    }

    if (!posterId || !postDescription) {
      console.log('[PushNotification] Missing required parameters (posterId or postDescription) - skipping post notification');
      return {
        success: false,
        message: 'Missing required parameters'
      };
    }

    // Get poster info
    const poster = await User.findByPk(posterId, {
      attributes: ['username', 'firstName', 'lastName', 'picture']
    });

    if (!poster) {
      console.error('[PushNotification] Poster not found');
      return {
        success: false,
        message: 'Poster not found'
      };
    }

    const posterName = poster.username || `${poster.firstName} ${poster.lastName}`.trim();
    
    // Prepare notification content
    const title = `New post from ${posterName}`;
    const shortDescription = postDescription.length > 50 
      ? `${postDescription.substring(0, 50)}...` 
      : postDescription;
    const body = shortDescription;

    console.log('[PushNotification] Notification content:', { title, body });

    // Prepare data payload with all values as strings
    const data = {
      ...Object.entries(customData).reduce((acc, [key, val]) => {
        acc[key] = String(val);
        return acc;
      }, {}),
      type: 'new_post',
      posterId: String(posterId),
      posterName: String(posterName),
      posterAvatar: poster.picture || '',
      timestamp: new Date().toISOString(),
      postType: postType ? String(postType) : '',
      postId: postId ? String(postId) : ''
    };

    // Make sure all followerIds are strings
    const validFollowerIds = followerIds.filter(id => id).map(id => String(id));

    // Send notification to followers
    return await sendPushNotification({
      title,
      body,
      data,
      userIds: validFollowerIds
    });

  } catch (error) {
    console.error('[PushNotification] Error in sendPostNotification:', {
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message
    };
  }
};

// Export the base function as well for reuse
exports.sendPushNotification = sendPushNotification;