module.exports = (sequelize, DataTypes) => {

    const ProfileView = sequelize.define("ProfileView", {
        viewerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        profileOwnerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        viewedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        clickCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
    }, {
        tableName: "profile_views",
        indexes: [
            { unique: true, fields: ["viewerId", "profileOwnerId"] },
        ],
    });

    ProfileView.associate = (models) => {
        ProfileView.belongsTo(models.User, { foreignKey: "viewerId", as: "Viewer" });
        ProfileView.belongsTo(models.User, { foreignKey: "profileOwnerId", as: "ProfileOwner" });
    };

    return ProfileView;
}


