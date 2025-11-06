module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define("Chat", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("private", "group"),
      defaultValue: "private",
      allowNull: false,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
    },
    profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
    },
  },{
      tableName: 'chats',
      timestamps: true,
    });

  Chat.associate = (models) => {
    
    Chat.hasMany(models.Message, {
      foreignKey: "chatId",
      as: "messages",
      onDelete: "CASCADE",
    });
    
    Chat.belongsToMany(models.Profile, {
      through: models.Member,
      as: "members",
      foreignKey: "chatId",
    });

    Chat.belongsTo(models.Profile, {
      foreignKey: "profileId",
      as: "creator",
    });

    Chat.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Chat;
};
