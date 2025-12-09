"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Community = void 0;
const sequelize_1 = require("sequelize");
class Community extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Community.belongsTo(models.User, { foreignKey: "userId", as: "user" });
        }
        if (models.Profile) {
            Community.belongsTo(models.Profile, { foreignKey: "profileId", as: "profile" });
        }
    }
    static initModel(sequelize) {
        Community.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: { model: "users", key: "id" },
                onDelete: "CASCADE",
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: { model: "profiles", key: "id" },
                onDelete: "CASCADE",
            },
            name: {
                type: sequelize_1.DataTypes.STRING(150),
                allowNull: false,
                validate: {
                    notEmpty: { msg: "Community name is required" },
                },
            },
            photo: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                defaultValue: "",
            },
            type: {
                type: sequelize_1.DataTypes.ENUM("public", "private"),
                allowNull: false,
                defaultValue: "public",
            },
            visibility: {
                type: sequelize_1.DataTypes.ENUM("public", "invite_only"),
                allowNull: false,
                defaultValue: "public",
            },
            inviteCode: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        }, {
            sequelize,
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
        return Community;
    }
}
exports.Community = Community;
exports.default = (sequelize) => Community.initModel(sequelize);
