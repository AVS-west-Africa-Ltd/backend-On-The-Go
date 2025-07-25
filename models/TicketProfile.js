const { PassThrough } = require("form-data");


module.exports = (sequelize, DataTypes) => {
const TicketProfile = sequelize.define('TicketProfile', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DOUBLE,
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
    routerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'networkRouters',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    bandwidth: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
},
{
  tableName: "ticketProfiles",
});

TicketProfile.associate = (models) => {
    TicketProfile.belongsTo(models.NetworkRouter, {
        foreignKey: "routerId",
        onDelete: "CASCADE",
    });

    TicketProfile.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
    });

    
};

return TicketProfile;
    
}