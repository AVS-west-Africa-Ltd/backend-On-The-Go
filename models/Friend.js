module.exports = (sequelize, DataTypes) => {
  const Friend = sequelize.define(
    'Friend',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
      }, 
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
      },
      friendId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
        allowNull: false,
        defaultValue: 'accepted',
      },
    },
    {
      tableName: 'friends',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['ownerId', 'friendId'],
        },
      ],
    }
  );

  Friend.associate = (models) => {
    Friend.belongsTo(models.Profile, {
      foreignKey: 'ownerId',
      as: 'following',
    });

    Friend.belongsTo(models.Profile, {
      foreignKey: 'friendId',
      as: 'follower',
    });
  };

  return Friend;
};
