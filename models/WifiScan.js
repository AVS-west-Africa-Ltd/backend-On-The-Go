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
    // This is your actual user identifier from the application
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    wifiName: {
      type: DataTypes.STRING,
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
    tableName: "wifiscan",
  }
);

WifiScan.associate = (models) => {
  WifiScan.hasMany(models.RepeatedCustomer, {
    foreignKey: "wifiScanId",
    as: "repeatedScans",
  });
};

module.exports = WifiScan;
