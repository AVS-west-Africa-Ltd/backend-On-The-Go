
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "posts",
          key: "id",
        },
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "comments",
          key: "id",
        },
      },
    },
    {
      tableName: "comments", // Explicitly set table name
    }
  );

  Comment.associate = (models) => {

      Comment.belongsTo(models.Post, { foreignKey: "postId", as: "post" });

      Comment.hasMany(models.Comment, {
        foreignKey: "parentId",
        as: "replies",
        onDelete: "CASCADE",
      });

      Comment.belongsTo(models.Comment, { foreignKey: "parentId", as: "parent" });

      Comment.belongsTo(models.User, {
        foreignKey: "authorId",
        as: "author",
        onDelete: "CASCADE",
      });
  };


  return  Comment;
    
}