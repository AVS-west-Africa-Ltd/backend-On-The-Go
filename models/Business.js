const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define("Business", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  logo: {
    type: DataTypes.STRING,
  },
  amenities: {
    type: DataTypes.TEXT,
  },
  cacDoc: {
    type: DataTypes.STRING,
  },
  openingTime: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue("openingTime");
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue("openingTime", JSON.stringify(value));
    },
  },
  closingTime: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue("closingTime");
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue("closingTime", JSON.stringify(value));
    },
  },
  social: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue("social");
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue("social", JSON.stringify(value));
    },
  },
  wifiName: {
    type: DataTypes.STRING,
  },
  wifiPassword: {
    type: DataTypes.STRING,
  },
});

module.exports = Business;
