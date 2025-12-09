"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Friend = void 0;
const sequelize_1 = require("sequelize");
class Friend extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            Friend.belongsTo(models.Profile, {
                foreignKey: "ownerId",
                as: "following",
            });
            Friend.belongsTo(models.Profile, {
                foreignKey: "friendId",
                as: "follower",
            });
        }
    }
    static initModel(sequelize) {
        Friend.init({
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
            ownerId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            friendId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            status: {
                type: sequelize_1.DataTypes.ENUM("pending", "accepted", "blocked"),
                allowNull: false,
                defaultValue: "accepted",
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
            tableName: "friends",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["ownerId", "friendId"],
                },
            ],
        });
        return Friend;
    }
}
exports.Friend = Friend;
exports.default = (sequelize) => Friend.initModel(sequelize);
