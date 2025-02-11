const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserFollowers = require('./UserFollowers');
const BusinessSchema = require('./Business');
const Notification = require('./Notification');

const User = sequelize.define('User', {  // Change from 'Users' to 'User'
    firstName: {
        type: DataTypes.STRING,
    },
    lastName: {
        type: DataTypes.STRING,
    },
    username: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
    },
    phone_number: {
        type: DataTypes.STRING,
    },
    picture: {
        type: DataTypes.TEXT,
    },
    bio: {
        type: DataTypes.TEXT,
    },
    interests: {
        type: DataTypes.JSON,
    },
    userType: {
        type: DataTypes.STRING,
    },
    followersCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    followingCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
}, {
    tableName: 'users', // Explicitly set table name
    indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['username'] },
    ]
});

User.belongsToMany(User, {
    as: 'Followers',
    through: UserFollowers,
    foreignKey: 'followedId',
    otherKey: 'followerId',
});

User.belongsToMany(User, {
    as: 'Following',
    through: UserFollowers,
    foreignKey: 'followerId',
    otherKey: 'followedId',
});

User.hasMany(Notification, {
    foreignKey: 'recipientId',
    as: 'ReceivedNotifications',
});

User.hasMany(Notification, {
    foreignKey: 'senderId',
    as: 'SentNotifications',
});

User.hasMany(BusinessSchema, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = User; // Export as 'User'
