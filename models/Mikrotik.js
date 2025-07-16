const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

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
      type: DataTypes.JSON,
      defaultValue: {
        status: 'new',
        items: []
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique:true,
      references: {
        model: 'Users', // or the actual table name
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
});


Mikrotik.associate = (models) => {
    Mikrotik.belongsTo(User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
    });
};

module.exports = Mikrotik;