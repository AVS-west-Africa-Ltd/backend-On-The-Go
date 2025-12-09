"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reaction = void 0;
const sequelize_1 = require("sequelize");
class Reaction extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Reaction.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });
        }
        // Polymorphic relationships
        if (models.Post) {
            Reaction.belongsTo(models.Post, {
                foreignKey: "targetId",
                constraints: false,
                as: "post",
            });
        }
        if (models.Comment) {
            Reaction.belongsTo(models.Comment, {
                foreignKey: "targetId",
                constraints: false,
                as: "comment",
            });
        }
    }
    static initModel(sequelize) {
        Reaction.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            targetId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            targetType: {
                type: sequelize_1.DataTypes.ENUM("post", "comment"),
                allowNull: false,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM("like", "dislike", "love"),
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
            tableName: "reactions",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["userId", "targetId", "targetType"],
                },
            ],
            scopes: {
                forPost: { where: { targetType: "post" } },
                forComment: { where: { targetType: "comment" } },
            },
        });
        return Reaction;
    }
}
exports.Reaction = Reaction;
exports.default = (sequelize) => Reaction.initModel(sequelize);
