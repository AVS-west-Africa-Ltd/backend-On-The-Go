
module.exports = (sequelize, DataTypes) => {
    const UserFollower = sequelize.define('UserFollower', {
        followerId: {
            type: DataTypes.INTEGER,  
        },
        followedId: {
            type: DataTypes.INTEGER,
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
        tableName: 'userfollowers'
    }
    );

    return UserFollower;
    
}