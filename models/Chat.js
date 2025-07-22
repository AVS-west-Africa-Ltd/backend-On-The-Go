
module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,  // Should be INTEGER to match User ID
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read'),
      defaultValue: 'sent'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    request: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true 
    }
  }, {
    tableName: 'chats',
    timestamps: true
  });

  Chat.associate = (models) => {
      Chat.belongsTo(models.User, {
        foreignKey: 'sender_id',
        as: 'sender'
      });

      Chat.belongsTo(models.Room, {
        foreignKey: "room_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
  };


  return  Chat;

    
}