const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
    location: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "wifiusers", // Explicitly set table name
  }
);

// Define the relationship between User and RepeatedCustomer
WifiScan.hasMany(RepeatedCustome, { foreignKey: "userId" });

module.exports = WifiScan;
