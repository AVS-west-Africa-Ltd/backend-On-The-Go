module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "comments",
      timestamps: true,
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, { foreignKey: "userId", as: "user" });

    Comment.belongsTo(models.Post, { foreignKey: "postId", as: "post" });

    Comment.hasMany(models.Comment, {
      foreignKey: "parentId",
      as: "replies",
      onDelete: "CASCADE",
    });
    
    Comment.belongsTo(models.Comment, {
      foreignKey: "parentId",
      as: "parent",
    });
  };

  return Comment;
};
