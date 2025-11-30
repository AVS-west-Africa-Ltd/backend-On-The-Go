module.exports = (sequelize, DataTypes) => {
    const Community = sequelize.define("Community", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
        },
        profileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "profiles", key: "id" },
            onDelete: "CASCADE",
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: { msg: "Community name is required" },
            },
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        type: {
            type: DataTypes.ENUM("public", "private"),
            allowNull: false,
            defaultValue: "public",
        },
        visibility: {
            type: DataTypes.ENUM("public", "invite_only"),
            allowNull: false,
            defaultValue: "public",
        },
        inviteCode: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: "communities",
        timestamps: true,
        indexes: [
            { fields: ["userId"] },
            { fields: ["profileId"] },
            { fields: ["type"] },
            { fields: ["visibility"] },
            { unique: true, fields: ["name"] },
            { unique: true, fields: ["inviteCode"] },
        ],
    });
    Community.associate = (models) => {
        Community.belongsTo(models.User, { foreignKey: "userId", as: "user" });
        Community.belongsTo(models.Profile, { foreignKey: "profileId", as: "profile" });
    };
    return Community;
};
