// models/VoucherTemplate.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const VoucherTemplate = sequelize.define("VoucherTemplate", {
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
    allowNull: false,
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
  specialCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  maxClaims: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "voucher_templates",
  timestamps: true
});

module.exports = VoucherTemplate;