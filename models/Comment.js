// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");
// const Post = require("./Post");
// const User = require("./User");

// const Comment = sequelize.define(
//   "Comments",
//   {
//     postId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       // references: {
//       //     model: Post,
//       //     key: 'id',
//       // },
//     },
//     postType: {
//       type: DataTypes.ENUM("user", "business"), // Specify possible tables
//       allowNull: false,
//     },
//     authorId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     content: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     parentId: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//       references: {
//         model: "comments",
//         key: "id",
//       },
//     },
//   },
//   {
//     tableName: "comments", // Explicitly set table name
//   }
// );

// Post.hasMany(Comment, {
//   foreignKey: "postId",
//   as: "comments",
//   onDelete: "CASCADE",
// });
// Comment.belongsTo(Post, { foreignKey: "postId", as: "post" });

// Comment.hasMany(Comment, {
//   foreignKey: "parentId",
//   as: "replies",
//   onDelete: "CASCADE",
// });
// Comment.belongsTo(Comment, { foreignKey: "parentId", as: "parent" });

// // User and Comment
// User.hasMany(Comment, {
//   foreignKey: "authorId",
//   as: "comments",
//   onDelete: "CASCADE",
// });
// Comment.belongsTo(User, { foreignKey: "authorId", as: "author" });

// module.exports = Comment;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Comment = sequelize.define(
  "Comment",
  {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postType: {
      type: DataTypes.ENUM("user", "business"), // Specifies which table the postId refers to
      allowNull: false,
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
    tableName: "comments",
  }
);

// Polymorphic associations (Post and BusinessPost)
Comment.belongsTo(User, { foreignKey: "authorId", as: "author" });

Comment.hasMany(Comment, {
  foreignKey: "parentId",
  as: "replies",
  onDelete: "CASCADE",
});
Comment.belongsTo(Comment, { foreignKey: "parentId", as: "parent" });

module.exports = Comment;
