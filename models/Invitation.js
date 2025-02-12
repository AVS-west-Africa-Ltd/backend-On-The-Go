// models/Invitation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invitation = sequelize.define('Invitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inviter_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invitees: {
    type: DataTypes.JSON, // Store a list of invitee user IDs as a JSON array
    allowNull: false
  }
}, {
  tableName: 'invitations',
  timestamps: true
});

module.exports = Invitation;