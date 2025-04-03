// botScheduler.js
const cron = require('node-cron');
const BotController = require('../controllers/BotController');
const { Post } = require('../models');

// Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running comment bot...');
    
    // Get the bot user ID from environment variables
    const botUserId = process.env.BOT_USER_ID;
    
    if (!botUserId) {
      console.error('BOT_USER_ID environment variable not set');
      return;
    }

    // Get count of recent posts (last hour)
    const recentPostCount = await Post.count({
      where: {
        userId: {
          [Op.ne]: botUserId
        },
        createdAt: {
          [Op.gte]: new Date(new Date() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (recentPostCount > 0) {
      await BotController.postCommentOnRecentPosts({
        body: {
          botUserId,
          postCount: Math.min(recentPostCount, 5) // Comment on up to 5 posts
        }
      }, {
        status: () => ({
          json: (result) => console.log('Bot result:', result)
        })
      });
    } else {
      console.log('No recent posts to comment on');
    }
  } catch (error) {
    console.error('Error in scheduled bot task:', error);
  }
});