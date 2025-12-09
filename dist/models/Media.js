"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const sequelize_1 = require("sequelize");
const media_types_1 = require("./types/media.types");
class Media extends sequelize_1.Model {
    static associate(models) {
        if (models.Post) {
            Media.belongsTo(models.Post, {
                foreignKey: "targetId",
                constraints: false,
                as: "post",
                scope: { targetType: "post" },
            });
        }
        if (models.Profile) {
            Media.belongsTo(models.Profile, {
                foreignKey: "targetId",
                constraints: false,
                as: "profile",
                scope: { targetType: "profile" },
            });
        }
        if (models.Product) {
            Media.belongsTo(models.Product, {
                foreignKey: "targetId",
                constraints: false,
                as: "product",
                scope: { targetType: "product" },
            });
        }
    }
    static initModel(sequelize) {
        Media.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
            },
            targetId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notNull: { msg: "Target ID is required" },
                    isInt: { msg: "Target ID must be an integer" },
                },
            },
            targetType: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(media_types_1.MediaTargetTypes)),
                allowNull: false,
                validate: {
                    notNull: { msg: "Target type is required" },
                    isIn: {
                        args: [["profile", "post", "business", "product", "review"]],
                        msg: "Target type must be one of: profile, post, business, product, review",
                    },
                },
            },
            filePath: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: "File path is required" },
                    notEmpty: { msg: "File path cannot be empty" },
                    isUrl: {
                        msg: "File path should be a valid URL or path",
                        // args: { require_protocol: false }, // Typescript might complain about args here depending on sequelize version
                    },
                },
            },
            fileName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: { msg: "File name cannot be empty if provided" },
                },
            },
            mimeType: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                validate: {
                    notEmpty: { msg: "MIME type cannot be empty if provided" },
                },
            },
            metadata: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: {},
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: true,
            },
            uploadOrder: {
                type: sequelize_1.DataTypes.INTEGER,
                defaultValue: 0,
                validate: {
                    min: { args: [0], msg: "Upload order cannot be negative" },
                },
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: "media",
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    name: "idx_media_target",
                    fields: ["targetType", "targetId"],
                },
                {
                    name: "idx_media_upload_order",
                    fields: ["targetType", "targetId", "uploadOrder"],
                },
                {
                    name: "idx_media_active",
                    fields: ["isActive"],
                },
            ],
        });
        return Media;
    }
}
exports.Media = Media;
exports.default = (sequelize) => Media.initModel(sequelize);
