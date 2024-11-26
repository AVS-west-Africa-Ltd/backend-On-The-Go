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
    type: DataTypes.ENUM('Public', 'Private'),
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
}, {
  tableName: 'rooms',
  timestamps: true,
});

module.exports = Room;
