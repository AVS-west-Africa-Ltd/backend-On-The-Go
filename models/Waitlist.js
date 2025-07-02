const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Waitlist = sequelize.define("Waitlist", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
}, {
  tableName: "waitlist",
  timestamps: true,
});

module.exports = Waitlist;
