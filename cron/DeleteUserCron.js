const cron = require('node-cron');
const { Op } = require('sequelize');
const User = require('../models/User');
const DeleteRequest = require('../models/DeleteRequest');

// Run every 24 hours
cron.schedule('0 0 * * *', async () => {
    console.log('Checking for expired deletion requests...');

    try {
        const expiredRequests = await DeleteRequest.findAll({
            where: { expiresAt: { [Op.lte]: new Date() }, status: 'pending' },
            include: User
        });

        for (const request of expiredRequests) {
            await User.destroy({ where: { id: request.userId } });
            await request.destroy();
            console.log(`Deleted user: ${request.userId}`);
        }
    } catch (error) {
        console.error('Error auto-deleting users:', error);
    }
});
