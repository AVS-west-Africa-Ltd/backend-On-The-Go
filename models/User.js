const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserFollowers = require('./UserFollowers');

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
    password: {
        type: DataTypes.STRING,
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
});

userSchema.belongsToMany(userSchema, {
    as: 'Followers',
    through: UserFollowers,
    foreignKey: 'followedId',
    otherKey: 'followerId',
});

userSchema.belongsToMany(userSchema, {
    as: 'Following',
    through: UserFollowers,
    foreignKey: 'followerId',
    otherKey: 'followedId',
});

sequelize.sync().then(() => {
    console.log('User Schema table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});

module.exports = userSchema;
