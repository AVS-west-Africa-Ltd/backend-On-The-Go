// models/VoucherExchangeRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const VoucherExchangeRequest = sequelize.define("VoucherExchangeRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requesterVoucherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestedVoucherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requesterUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestedUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "voucher_exchange_requests",
  timestamps: true
});

module.exports = VoucherExchangeRequest;