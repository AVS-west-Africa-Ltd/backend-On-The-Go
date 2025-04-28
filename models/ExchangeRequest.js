const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExchangeRequest = sequelize.define("ExchangeRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requesterVoucherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetVoucherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requesterUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: "exchange_requests",
  timestamps: true
});

module.exports = ExchangeRequest;