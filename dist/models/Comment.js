"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const sequelize_1 = require("sequelize");
class Comment extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Comment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
        }
        if (models.Post) {
            Comment.belongsTo(models.Post, { foreignKey: "postId", as: "post" });
        }
        if (models.Comment) {
            Comment.hasMany(models.Comment, {
                foreignKey: "parentId",
                as: "replies",
                onDelete: "CASCADE",
            });
            Comment.belongsTo(models.Comment, {
                foreignKey: "parentId",
                as: "parent",
            });
        }
    }
    static initModel(sequelize) {
        Comment.init({
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
            postId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            parentId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            body: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            likes: {
                type: sequelize_1.DataTypes.INTEGER,
                defaultValue: 0,
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
            tableName: "comments",
            timestamps: true,
        });
        return Comment;
    }
}
exports.Comment = Comment;
exports.default = (sequelize) => Comment.initModel(sequelize);
