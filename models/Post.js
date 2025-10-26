module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      postType: {
        type: DataTypes.ENUM("review", "normal"),
        allowNull: false,
        defaultValue: "normal"
      },
      reviewTarget: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      comments: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      media: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      rating: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      bookmarks: {
        type: DataTypes.JSON,
        allowNull: true,
      },

    },
    {
      tableName: "posts",
      timestamps: true,
    }
  );

  Post.associate = (models) => {
    
    Post.belongsTo(models.User, { foreignKey: "userId", as: "user" });

    Post.belongsTo(models.Profile, { foreignKey: "profileId", as: "author" });
    Post.belongsTo(models.Profile, { foreignKey: "reviewTarget", as: "business" });

    Post.hasMany(models.Comment, {
      foreignKey: "postId",
      as: "comment",
      onDelete: "CASCADE",
    });
  };

  return Post;
};
