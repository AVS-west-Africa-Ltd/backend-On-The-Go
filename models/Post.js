const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const ImageSchema = require("../models/Image");
const Business = require("../models/Business");
const User = require("../models/User");

const PostSchema = sequelize.define(
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

PostSchema.belongsTo(Business, { foreignKey: "businessId", as: "business" });
PostSchema.belongsTo(User, { foreignKey: "userId", as: "user" });

PostSchema.hasMany(ImageSchema, {
  foreignKey: "postId",
  as: "images",
  onDelete: "CASCADE",
});
ImageSchema.belongsTo(PostSchema, { foreignKey: "postId", as: "images" });

sequelize
  .sync()
  .then(() => {
    console.log("Posts table created successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

module.exports = PostSchema;
