const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Room = require('./Room');

const Invitation = sequelize.define('Invitation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    inviter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Room,
            key: 'id',
        },
    },
    invitees: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    // Disable automatic timestamps
    timestamps: false,
    // Use the exact table name from your schema
    tableName: 'invitations'
});

// Add associations
User.hasMany(Invitation, { foreignKey: 'inviter_id' });
Invitation.belongsTo(User, { foreignKey: 'inviter_id' });

Room.hasMany(Invitation, { foreignKey: 'room_id' });
Invitation.belongsTo(Room, { foreignKey: 'room_id' });

module.exports = Invitation;