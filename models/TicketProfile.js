

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

TicketProfile.associate = (models) => {
    TicketProfile.belongsTo(models.Mikrotik, {
        foreignKey: "mikrotikId",
        onDelete: "CASCADE",
    });

    TicketProfile.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
    });
};

return TicketProfile;
    
}