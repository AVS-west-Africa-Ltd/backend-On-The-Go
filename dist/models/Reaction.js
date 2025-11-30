module.exports = (sequelize, DataTypes) => {
    const Reaction = sequelize.define('Reaction', {
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
        targetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        targetType: {
            type: DataTypes.ENUM('post', 'comment'),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('like', 'dislike', 'love'),
            allowNull: false,
        },
    }, {
        tableName: 'reactions',
        indexes: [
            {
                unique: true,
                fields: ['userId', 'targetId', 'targetType'],
            },
        ],
    });
    Reaction.associate = (models) => {
        Reaction.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
        });
        // Polymorphic relationships
        Reaction.belongsTo(models.Post, {
            foreignKey: 'targetId',
            constraints: false,
            as: 'post',
        });
        Reaction.belongsTo(models.Comment, {
            foreignKey: 'targetId',
            constraints: false,
            as: 'comment',
        });
    };
    Reaction.addScope('forPost', { where: { targetType: 'post' } });
    Reaction.addScope('forComment', { where: { targetType: 'comment' } });
    return Reaction;
};
