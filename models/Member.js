module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define("Member", {
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    memberType: {
      type: DataTypes.ENUM("community", "chat"),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("member", "admin"),
      defaultValue: "member",
    },

  }, {
    tableName: "members",
    indexes: [{ unique: true, fields: ["targetId", "profileId", "memberType"] }],
  });

  
  Member.associate = (models) => {
    
    Member.belongsTo(models.Community, {
      foreignKey: "targetId",
      as: "community",
      onDelete: "CASCADE",
    });

    
    Member.belongsTo(models.Profile, {
      foreignKey: "profileId",
      as: "profile",
      onDelete: "CASCADE",
    });
  };

  return Member;
};