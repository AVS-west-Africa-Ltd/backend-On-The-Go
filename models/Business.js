const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define("Business", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  logo: {
    type: DataTypes.STRING,
  },
  amenities: {
    type: DataTypes.TEXT,
  },
  cacDoc: {
    type: DataTypes.STRING,
  },
  openingTime: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  closingTime: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  social: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  wifiName: {
    type: DataTypes.STRING,
  },
  wifiPassword: {
    type: DataTypes.STRING,
  },
});

module.exports = Business;
