// models/UserFollowers.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserFollowers = sequelize.define('UserFollowers', {
    followerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    followedId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'blocked'),
        defaultValue: 'active',
    },
    followedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
},{
tableName: 'userfollowers' // Explicitly set table name
}
);

module.exports = UserFollowers;
