// Voucher.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Voucher = sequelize.define("Voucher", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  currentOwnerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  discountPercent: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 100
    }
  },
  validDays: {
    type: DataTypes.JSON,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isTraded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tradeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  previousOwners: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  usageHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  businessImage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  specialData: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, 
{
  tableName: "vouchers",
  timestamps: true
});

module.exports = Voucher;