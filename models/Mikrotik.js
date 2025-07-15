const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Business = require("./Business");

const Mikrotik = sequelize.define('Mikrotik', {
    host: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 8728 
    },
    ssl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
       type: Schema.Types.Mixed,
       defaultValue: {}
    },
    businessId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Businesses', // or the actual table name
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
});

Mikrotik.belongsTo(Business, {
    foreignKey: "businessId",
    onDelete: "CASCADE",
});

module.exports = Mikrotik;