const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Mikrotik = require("./Mikrotik");

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
      defaultValue: {},
      get() {
        const rawValue = this.getDataValue('amenities');
        return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      },
      set(value) {
        this.setDataValue('amenities', typeof value === 'string' ? value : JSON.stringify(value));
      }
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
    wifiPlans: {
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
    splitCode: {
       type: DataTypes.STRING,
      allowNull: true,
      field: 'split_code'
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'bank_name' // Explicit mapping to snake_case column
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_name'
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'account_number'
    },
  },
  {
    tableName: "businesses", // Explicitly set table name
  }
);

Business.hasOne(Mikrotik, {
    foreignKey: "businessId",
    onDelete: "CASCADE",
});

module.exports = Business;