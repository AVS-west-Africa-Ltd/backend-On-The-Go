const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserFollowers = require('./UserFollowers');
const BusinessSchema = require('./Business');

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
}, {
    tableName: 'Users' // Explicitly set table name
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

User.hasMany(BusinessSchema, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = User; // Export as 'User'
