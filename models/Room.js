const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true, // Can be null for direct messages
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field for room description
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field for room image URL
  },
  status: {
    type: DataTypes.ENUM('Public', 'Private', 'Broadcast'),
    allowNull: false,
    defaultValue: 'Public', // Default to Public if not provided
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false, // ID of the user who created the room
  },
  total_members: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // Default to 0 for new rooms
  },
  broadcast_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Default to false (broadcast feature is off)
    allowNull: false
  },
  is_private_displayed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Default to true for backward compatibility
  },
  join_requests: {
    type: DataTypes.JSON,
    defaultValue: [], // Ensure this is always an array
    allowNull: false, // Prevent null values
  },
  created_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW // This will automatically set the current timestamp when a room is created
  }
}, {
  tableName: 'rooms',
  timestamps: true, // This enables createdAt and updatedAt
});

// Define the association between Room and Chat
Room.associate = (models) => {
  Room.hasMany(models.Chat, {
    foreignKey: 'room_id',
    as: 'Chats', // Changed to match the error message
  });
};
module.exports = Room;