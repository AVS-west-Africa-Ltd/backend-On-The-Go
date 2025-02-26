const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const WifiScan = require("./WifiScan");

// RepeatedCustomer Model
const RepeatedCustomer = sequelize.define(
  "RepeatedCustomer",
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
    scannedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "repeatedcustomers", // Explicitly set table name
  }
);

RepeatedCustomer.associate = (models) => {
  RepeatedCustomer.belongsTo(models.WifiScan, {
    foreignKey: "userId",
    as: "repeatedCustomers",
  });
};
// RepeatedCustomer.belongsTo(WifiScan, { foreignKey: "userId" });

module.exports = RepeatedCustomer;
