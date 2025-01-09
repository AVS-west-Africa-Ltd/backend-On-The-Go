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
    followedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = UserFollowers;
