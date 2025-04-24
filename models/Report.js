// models/Report.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reporter_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'User ID of the person who submitted the report'
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewing', 'resolved', 'dismissed'),
    defaultValue: 'pending'
  },
  entity_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of entity being reported (user, post, business, etc.)'
  },
  entity_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the entity being reported'
  }
}, {
  tableName: 'reports',
  timestamps: true
});

module.exports = Report;