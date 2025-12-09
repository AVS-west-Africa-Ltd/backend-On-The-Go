"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Member = void 0;
const sequelize_1 = require("sequelize");
class Member extends sequelize_1.Model {
    static associate(models) {
        if (models.Community) {
            Member.belongsTo(models.Community, {
                foreignKey: "targetId",
                as: "community",
                constraints: false,
            });
        }
        if (models.Chat) {
            Member.belongsTo(models.Chat, {
                foreignKey: "targetId",
                as: "chat",
                constraints: false
            });
        }
        if (models.Profile) {
            Member.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        Member.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            targetId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            memberType: {
                type: sequelize_1.DataTypes.ENUM("community", "chat"),
                allowNull: false,
            },
            role: {
                type: sequelize_1.DataTypes.ENUM("member", "admin"),
                defaultValue: "member",
            },
            isAccepted: {
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
            tableName: "members",
            timestamps: true, // Assuming timestamps are on (default)
            indexes: [
                { unique: true, fields: ["targetId", "profileId", "memberType"] },
            ],
        });
        return Member;
    }
}
exports.Member = Member;
exports.default = (sequelize) => Member.initModel(sequelize);
