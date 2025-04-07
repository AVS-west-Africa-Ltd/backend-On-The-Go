const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const WifiScan = require("./WifiScan");

const RepeatedCustomer = sequelize.define(
  "RepeatedCustomer",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    // This field links to the original WifiScan record (the first scan)
    wifiScanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: WifiScan, // Reference the WifiScan model
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location: {
      type: DataTypes.JSON,
    },
    wifiName: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // scannedAt: {
    //   type: DataTypes.DATE,
    //   defaultValue: DataTypes.NOW,
    // },
  },
  {
    tableName: "repeatedcustomers",
  }
);

RepeatedCustomer.associate = function (models) {
  RepeatedCustomer.belongsTo(models.WifiScan, {
    foreignKey: "wifiScanId",
    as: "wifiScan",
  });
};

module.exports = RepeatedCustomer;
