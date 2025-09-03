module.exports = (sequelize, DataTypes) => {
  const BlockedUser = sequelize.define('BlockedUser', {
    user: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    blocked: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'blockusers',
    timestamps: true 
  });

  BlockedUser.associate = (models) => {
    
    BlockedUser.belongsTo(models.User, {
      foreignKey: 'user',
      as: 'blocker'
    });

    
    BlockedUser.belongsTo(models.User, {
      foreignKey: 'blocked',
      as: 'blockedUser'
    });
  };

  return BlockedUser;
};