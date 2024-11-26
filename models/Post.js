const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    pictures: {
        type: DataTypes.JSON,
        allowNull: true,
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

sequelize.sync().then(() => {
    console.log('Posts table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});

module.exports = PostSchema;

