// models/UserFollowers.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Business = require("./Business");
const User = require("./User");

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

// Define associations
UserFollowers.associate = (models) => {
  UserFollowers.belongsTo(models.User, {
    foreignKey: "followerId",
    as: "follower",
  });

  // Polymorphic association for followedId
  UserFollowers.belongsTo(models.User, {
    foreignKey: "followedId",
    constraints: false,
    as: "followedUser",
  });

  UserFollowers.belongsTo(models.Business, {
    foreignKey: "followedId",
    constraints: false,
    as: "followedBusiness",
  });
};

module.exports = UserFollowers;
