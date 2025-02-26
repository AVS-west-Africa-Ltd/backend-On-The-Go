const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const WifiScan = require("./WifiUser");

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
      references: {
        model: User, // Reference the User model
        key: "id",
      },
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

// Define the relationship between User and RepeatedCustomer
// WifiScan.hasMany(RepeatedCustomer, { foreignKey: "userId" });
RepeatedCustomer.belongsTo(WifiScan, { foreignKey: "userId" });

module.exports = { WifiScan, RepeatedCustomer };
