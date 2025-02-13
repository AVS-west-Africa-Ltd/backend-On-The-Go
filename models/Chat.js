const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    defaultValue: 'sent'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  request: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true 
  }
}, {
  tableName: 'chats',
  timestamps: true
});

// Define the association between Chat and Room
Chat.associate = (models) => {
  Chat.belongsTo(models.Room, {
    foreignKey: 'room_id', // Foreign key in the Chat model
    as: 'room', // Alias for the association
  });
};

module.exports = Chat;