const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Import User model

const RoomMember = sequelize.define('RoomMember', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER, // Change from STRING to INTEGER if user ID is stored as a number
        allowNull: false
    },
    joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    tableName: 'room_members',
    timestamps: true
});

// Associate RoomMember with User
RoomMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = RoomMember;
