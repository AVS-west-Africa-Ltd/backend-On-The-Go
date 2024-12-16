const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Post = require('./Post');
const User = require('./User');

const Comment = sequelize.define('Comments', {
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Post,
            key: 'id',
        },
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Comments',
            key: 'id',
        },
    },
});

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });


Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });


module.exports = Comment;
