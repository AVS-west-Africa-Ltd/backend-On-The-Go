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
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  logo: {
    type: DataTypes.STRING,
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  cacDoc: {
    type: DataTypes.STRING,
  },
  hours: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  social: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  wifi: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
},
{
  tableName: 'businesses' // Explicitly set table name
  }
);

module.exports = Business;
