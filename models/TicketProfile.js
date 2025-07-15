const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Mikrotik = require("./Mikrotik");

const TicketProfile = sequelize.define('TicketProfile', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    mikrotikId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Mikrotiks',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
});

TicketProfile.belongsTo(Mikrotik, {
    foreignKey: "businessId",
    onDelete: "CASCADE",
});

module.exports = Mikrotik;