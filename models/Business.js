const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define(
  "Business",
  {
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
    // location: {
    //   type: DataTypes.TEXT,
    // },
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
    plan: {
      type: DataTypes.ENUM,
      values: ["free", "premium"],
      defaultValue: "free",
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
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "businesses", // Explicitly set table name
  }
);

module.exports = Business;
