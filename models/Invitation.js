
module.exports = (sequelize, DataTypes) => {
  const Invitation = sequelize.define('Invitation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    inviter_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    invitees: {
      type: DataTypes.JSON, // Store a list of invitee user IDs as a JSON array
      allowNull: false
    }
  }, {
    tableName: 'invitations',
    timestamps: true
  });

  Invitation.associate = (models) => {
      Invitation.belongsTo(models.Room, {
        as: "room",
        foreignKey: "room_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
  };

  return Invitation;  
  
}