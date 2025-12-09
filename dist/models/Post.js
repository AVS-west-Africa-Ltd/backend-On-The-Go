"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const sequelize_1 = require("sequelize");
class Post extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Post.belongsTo(models.User, { foreignKey: "userId", as: "user" });
        }
        if (models.Profile) {
            Post.belongsTo(models.Profile, { foreignKey: "profileId", as: "author" });
            Post.belongsTo(models.Profile, { foreignKey: "target", as: "business" });
        }
        if (models.Branch) {
            Post.belongsTo(models.Branch, { foreignKey: "branchId", as: "branch" });
        }
        if (models.Comment) {
            Post.hasMany(models.Comment, {
                foreignKey: "postId",
                as: "comment",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        Post.init({
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
            branchId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            body: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            postType: {
                type: sequelize_1.DataTypes.ENUM("review", "normal"),
                allowNull: false,
                defaultValue: "normal",
            },
            targetId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            targetType: {
                type: sequelize_1.DataTypes.ENUM("community", "business"),
                allowNull: false,
                defaultValue: "community",
            },
            likes: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            comments: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            media: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
            },
            rating: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: {},
            },
            bookmarks: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
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
            tableName: "posts",
            timestamps: true,
        });
        return Post;
    }
}
exports.Post = Post;
exports.default = (sequelize) => Post.initModel(sequelize);
