
module.exports = (sequelize, DataTypes) => {

    const RoomMember = sequelize.define('RoomMember', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER, // Change from STRING to INTEGER if user ID is stored as a number
            allowNull: false
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        last_read_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        is_admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    }, {
        tableName: 'room_members',
        timestamps: true
    });

    // Associate RoomMember with User
    RoomMember.associate = (models) => {
        RoomMember.belongsTo(models.User, { foreignKey: 'user_id' });
        RoomMember.belongsTo(models.Room, { foreignKey: 'room_id' });
        RoomMember.belongsTo(models.Room, {
            foreignKey: "room_id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
    };

    return RoomMember;
}