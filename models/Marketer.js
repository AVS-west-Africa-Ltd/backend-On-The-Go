// models/Marketer.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Marketer = sequelize.define('Marketer', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Manual relationship methods
Marketer.prototype.getTerritories = async function() {
  return await sequelize.models.MarketerTerritory.findAll({
    where: { marketerId: this.id }
  });
};

Marketer.prototype.addTerritory = async function(territoryData) {
  return await sequelize.models.MarketerTerritory.create({
    ...territoryData,
    marketerId: this.id
  });
};

module.exports = Marketer;