module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Posts",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      businessId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      postType: {
        type: DataTypes.ENUM,
        values: ["individual", "business"],
        allowNull: false,
      },
      likes: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      media: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      ratingsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      bookmarks: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: "posts", // Explicitly set table name
    }
  );

  Post.associate = (models) => {

      Post.belongsTo(models.Business, { foreignKey: "businessId", as: "business" });
      Post.belongsTo(models.Business, { foreignKey: "businessId", as: "business" });
      Post.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Post.hasMany(models.ImageSchema, {
        foreignKey: "postId",
        as: "images",
        onDelete: "CASCADE",
      });
      Post.hasMany(models.Comment, {
        foreignKey: "postId",
        as: "comments",
        onDelete: "CASCADE",
      });
  };


  return Post;
  
}
