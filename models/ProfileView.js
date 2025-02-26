const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

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

User.hasMany(ProfileView, { foreignKey: "profileOwnerId", as: "ProfileViews" });
User.hasMany(ProfileView, { foreignKey: "viewerId", as: "ViewedProfiles" });

ProfileView.belongsTo(User, { foreignKey: "viewerId", as: "Viewer" });
ProfileView.belongsTo(User, { foreignKey: "profileOwnerId", as: "ProfileOwner" });

module.exports = ProfileView;
