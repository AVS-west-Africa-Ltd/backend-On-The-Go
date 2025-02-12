const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const cron = require('node-cron');
const Chat = require('./models/Chat');
const sequelize = require('./config/database');

class MediaCleanupService {
  constructor() {
    this.uploadsPath = path.join(__dirname, 'uploads', 'chat');
    
    // Immediate logging on startup
    this.log('===========================================');
    this.log('🚀 Media Cleanup Service Starting');
    this.log('===========================================');
    this.log(`📁 Upload path: ${this.uploadsPath}`);
    
    // Immediately show current database state
    this.showCurrentDatabaseState();
    
    // Initialize cleanup schedule
    this.initializeCleanupSchedule();
  }

  async showCurrentDatabaseState() {
    try {
      const totalImages = await Chat.count({
        where: {
          media_url: {
            [Op.ne]: null
          }
        }
      });

      const recentImages = await Chat.findAll({
        where: {
          media_url: {
            [Op.ne]: null
          }
        },
        attributes: ['id', 'media_url', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      this.log('===========================================');
      this.log(`📊 Current Database State`);
      this.log(`📸 Total images in database: ${totalImages}`);
      this.log('🔍 Most recent images:');
      
      recentImages.forEach(image => {
        const age = Math.round((Date.now() - new Date(image.createdAt).getTime()) / (1000 * 60 * 60)); // age in hours
        this.log(`   ID: ${image.id} | Age: ${age}hrs | URL: ${image.media_url}`);
      });
      
      this.log('===========================================');
    } catch (error) {
      this.log(`Error fetching database state: ${error.message}`, 'error');
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = '[MediaCleanup]';
    
    switch(type) {
      case 'error':
        console.error(`${prefix} ${timestamp} ❌ ERROR: ${message}`);
        break;
      case 'warning':
        console.warn(`${prefix} ${timestamp} ⚠️ WARNING: ${message}`);
        break;
      case 'success':
        console.log(`${prefix} ${timestamp} ✅ SUCCESS: ${message}`);
        break;
      default:
        console.log(`${prefix} ${timestamp} ℹ️ INFO: ${message}`);
    }
  }

  async initializeCleanupSchedule() {
    const cronSchedule = '0 * * * *'; // Every hour
    this.log(`⏰ Setting up cleanup schedule: ${cronSchedule} (runs every hour)`);
    
    // Run immediate cleanup on startup
    this.log('📝 Running initial cleanup check...');
    await this.cleanupOldMedia();

    // Schedule regular cleanups
    cron.schedule(cronSchedule, async () => {
      this.log('🔄 Starting scheduled media cleanup');
      this.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      
      try {
        await this.cleanupOldMedia();
      } catch (error) {
        this.log(`Cleanup failed: ${error.message}`, 'error');
        this.log(error.stack, 'error');
      }
    });
  }

  async cleanupOldMedia() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.log(`🔍 Checking for media older than: ${twentyFourHoursAgo.toISOString()}`);

    try {
      const transaction = await sequelize.transaction();
      this.log('📝 Started cleanup transaction');

      try {
        const oldMediaChats = await Chat.findAll({
          where: {
            media_url: {
              [Op.ne]: null
            },
            createdAt: {
              [Op.lt]: twentyFourHoursAgo
            }
          },
          transaction
        });

        this.log(`📁 Found ${oldMediaChats.length} old media files to clean up`);

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const chat of oldMediaChats) {
          try {
            const mediaUrl = new URL(chat.media_url);
            const filename = path.basename(mediaUrl.pathname);
            const filepath = path.join(this.uploadsPath, filename);
            
            this.log(`🗑️ Processing: Chat ID ${chat.id} | File: ${filename}`);

            try {
              await fs.access(filepath);
              await fs.unlink(filepath);
              this.log(`✨ Deleted file: ${filename}`, 'success');
            } catch (err) {
              if (err.code === 'ENOENT') {
                this.log(`⚠️ File not found: ${filename}`, 'warning');
                skippedCount++;
              } else {
                throw err;
              }
            }

            await chat.update({
              media_url: null
            }, { transaction });

            successCount++;

          } catch (error) {
            this.log(`Failed to process chat ID ${chat.id}: ${error.message}`, 'error');
            errorCount++;
          }
        }

        await transaction.commit();
        this.log('✅ Cleanup transaction committed', 'success');

        // Show cleanup summary
        this.log('===========================================');
        this.log('📊 Cleanup Summary');
        this.log(`📝 Total processed: ${oldMediaChats.length}`);
        this.log(`✅ Successfully cleaned: ${successCount}`);
        this.log(`❌ Errors: ${errorCount}`);
        this.log(`⚠️ Skipped: ${skippedCount}`);
        this.log('===========================================');

        // Show updated database state after cleanup
        await this.showCurrentDatabaseState();

      } catch (error) {
        await transaction.rollback();
        this.log('❌ Transaction rolled back due to error', 'error');
        throw error;
      }
    } catch (error) {
      this.log(`❌ Fatal error during cleanup: ${error.message}`, 'error');
      this.log(error.stack, 'error');
      throw error;
    }
  }
}

// Create and export service instance
const mediaCleanupService = new MediaCleanupService();
module.exports = mediaCleanupService;