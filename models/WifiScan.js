const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const RepeatedCustomer = require("./RepeatedCustomers");

const WifiScan = sequelize.define(
  "WifiScan",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location: {
      type: DataTypes.JSON,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "wifiscan", // Explicitly set table name
  }
);

// Define the relationship between User and RepeatedCustomer
WifiScan.hasMany(RepeatedCustomer, { foreignKey: "userId" });

module.exports = WifiScan;
