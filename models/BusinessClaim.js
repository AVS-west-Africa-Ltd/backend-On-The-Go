const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessClaim = sequelize.define(
  "BusinessClaim",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    legalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cacDocumentUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionalDocumentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending_verification', 'approved', 'rejected'),
      defaultValue: 'pending_verification'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // This will reference the Business ID if a business is created from this claim
    }
  },
  {
    tableName: "business_claims",
  }
);

module.exports = BusinessClaim;