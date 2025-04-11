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

// Export the reusable function
module.exports = {
  ...exports,
  sendPushNotification
};