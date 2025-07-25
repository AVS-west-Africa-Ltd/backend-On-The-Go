

module.exports = (sequelize, DataTypes) => {
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
    routerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'networkRouters',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
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