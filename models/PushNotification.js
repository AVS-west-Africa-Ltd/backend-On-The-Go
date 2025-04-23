const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PushNotification = sequelize.define("PushNotification", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  recipientsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failureCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: "push_notifications",
  timestamps: true
});

module.exports = PushNotification;
