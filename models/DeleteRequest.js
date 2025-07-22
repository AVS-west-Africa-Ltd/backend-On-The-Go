

module.exports = (sequelize, DataTypes) => {
    
    const DeleteRequest = sequelize.define('DeleteRequest', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: 'id'
            },
            onDelete: 'CASCADE',
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'denied'),
            defaultValue: 'pending',
        },
        expiresAt: {
            type: DataTypes.DATE,
        }
    }, {
        tableName: 'delete_requests'
    });
    DeleteRequest.associate = (models) => {
        DeleteRequest.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    };

    return DeleteRequest;
}