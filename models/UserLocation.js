// models/UserLocation.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserLocation = sequelize.define("UserLocation", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
}, {
  tableName: "user_locations",
  timestamps: true,
});

module.exports = UserLocation;
