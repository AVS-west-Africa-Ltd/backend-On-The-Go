// models/ZoneBusiness.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you have a database config file

const ZoneBusiness = sequelize.define('ZoneBusiness', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zone: {
    type: DataTypes.CHAR(1),
    allowNull: false,
  },
  registered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  radius: {
    type: DataTypes.INTEGER,
    defaultValue: 3000, // Default radius in meters
  },
});

module.exports = ZoneBusiness;