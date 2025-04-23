// models/UserVoucher.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserVoucher = sequelize.define("UserVoucher", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  claimedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  giftedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  giftedFrom: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uniqueCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  }
}, {
  tableName: "user_vouchers",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['templateId', 'userId'],
      name: 'unique_user_template'
    }
  ]
});

module.exports = UserVoucher;