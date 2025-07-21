const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImageSchema = sequelize.define('Images', {
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
},
{
    tableName: 'images' // Explicitly set table name
  }
);



module.exports = ImageSchema;
