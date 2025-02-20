// models/UserFollowers.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserFollowers = sequelize.define(
  "UserFollowers",
  {
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    followedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    followedType: {
      type: DataTypes.ENUM("user", "business"), // Distinguishes users from businesses
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "blocked"),
      defaultValue: "active",
    },
    followedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "userfollowers",
  }
);

module.exports = UserFollowers;
