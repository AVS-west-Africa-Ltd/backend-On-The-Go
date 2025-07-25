const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Referral = sequelize.define(
  "Referral",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    referrerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    refereeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    // Remove the referralCode field from the Referral model
    // since we'll use the User's referralCode instead
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'rewarded'),
      defaultValue: 'pending',
    },
  },
  {
    tableName: "referrals",
    timestamps: true,
  }
);

module.exports = Referral;