const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const DeleteRequest = sequelize.define('DeleteRequest', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE',
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'denied'),
        defaultValue: 'pending',
    },
    expiresAt: {
        type: DataTypes.DATE,
    }
}, {
    tableName: 'delete_requests'
});

DeleteRequest.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = DeleteRequest;
