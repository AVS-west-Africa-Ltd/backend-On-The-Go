const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const userSchema = sequelize.define('Users', {
    firstName: {
        type: DataTypes.STRING,
    },
    lastName: {
        type: DataTypes.STRING,
    },
    username: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone_number: {
        type: DataTypes.STRING,
    },
    picture: {
        type: DataTypes.TEXT,
    },
    bio: {
        type: DataTypes.TEXT,
    },
    interests: {
        type: DataTypes.JSON,
    },
    notifications: {
        type: DataTypes.JSON,
    }
});

sequelize.sync().then(() => {
    console.log('User Schema table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});

module.exports = userSchema;
