"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Social = void 0;
const sequelize_1 = require("sequelize");
class Social extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Social.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
                onDelete: "CASCADE",
            });
        }
        if (models.Profile) {
            Social.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        Social.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            platform: {
                type: sequelize_1.DataTypes.ENUM("facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube", "telegram", "threads", "other"),
                allowNull: false,
            },
            url: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                validate: { isUrl: true },
            },
            meta: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: {},
            },
            isVerified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
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
            tableName: "socials",
            timestamps: true,
            indexes: [
                { fields: ["userId"] },
                { fields: ["platform"] },
                {
                    unique: true,
                    fields: ["profileId", "platform"],
                },
            ],
        });
        return Social;
    }
}
exports.Social = Social;
exports.default = (sequelize) => Social.initModel(sequelize);
