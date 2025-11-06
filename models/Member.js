module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define("Member", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM("member", "admin"),
      defaultValue: "member",
    },
    },{
      tableName: 'members',
      timestamps: true,
    });

  Member.associate = (models) => {
    Member.belongsTo(models.Chat, { foreignKey: "chatId" });
    Member.belongsTo(models.Profile, { foreignKey: "profileId" });
  };

  return Member;
};