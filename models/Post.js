const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ImageSchema = require('../models/Image');

const PostSchema = sequelize.define('Posts', {
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
    likes: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    ratingsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    bookmarks: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
});

PostSchema.hasMany(ImageSchema, { foreignKey: 'postId', as: 'images', onDelete: 'CASCADE' });
ImageSchema.belongsTo(PostSchema, {foreignKey: 'postId', as: 'images'});

sequelize.sync().then(() => {
    console.log('Posts table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});

module.exports = PostSchema;

