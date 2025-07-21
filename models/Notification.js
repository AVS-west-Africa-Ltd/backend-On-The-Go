module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        type: {
            type: DataTypes.ENUM('follow', 'unfollow', 'mention', 'like', 'comment'),
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'notifications' // Explicitly set table name
    }
    );

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, {
            foreignKey: "senderId",
            as: "Sender",
        });

        Notification.belongsTo(models.User, {
        foreignKey: "recipientId",
        as: "Recipient",
        });
    };

    return Notification;
  
}
