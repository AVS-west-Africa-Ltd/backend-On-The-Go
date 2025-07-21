const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Mikrotik = require("./Mikrotik");
const User = require("./User");

const TicketProfile = sequelize.define('TicketProfile', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    mikrotikId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'mikrotiks',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
});

TicketProfile.belongsTo(Mikrotik, {
    foreignKey: "mikrotikId",
    onDelete: "CASCADE",
});

TicketProfile.belongsTo(User, {
    foreignKey: "userId",
    onDelete: "CASCADE",
});

module.exports = TicketProfile;