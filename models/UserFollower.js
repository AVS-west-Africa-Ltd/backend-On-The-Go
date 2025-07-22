
module.exports = (sequelize, DataTypes) => {
    const UserFollower = sequelize.define('UserFollower', {
        followerId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        followedId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'blocked'),
            defaultValue: 'active',
        },
        followedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },{
    tableName: 'userfollowers' // Explicitly set table name
    }
    );

    return UserFollower;
    
}