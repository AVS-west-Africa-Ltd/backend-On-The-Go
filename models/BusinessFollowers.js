// models/BusinessFollowers.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessFollowers = sequelize.define("BusinessFollowers", {
  followerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  followedId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  followedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = BusinessFollowers;
