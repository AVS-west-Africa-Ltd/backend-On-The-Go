"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardRedeemHour = void 0;
const sequelize_1 = require("sequelize");
class RewardRedeemHour extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            RewardRedeemHour.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "businessProfile",
            });
        }
    }
    static initModel(sequelize) {
        RewardRedeemHour.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            businessId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            dayOfWeek: {
                type: sequelize_1.DataTypes.ENUM("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"),
                allowNull: false,
            },
            openTime: {
                type: sequelize_1.DataTypes.TIME,
                allowNull: false,
                comment: "Business opening time (HH:mm:ss)",
            },
            closeTime: {
                type: sequelize_1.DataTypes.TIME,
                allowNull: false,
                comment: "Business closing time (HH:mm:ss)",
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
            tableName: "reward_redeem_hours",
            timestamps: true,
            indexes: [
                { fields: ["businessId"] },
                { unique: true, fields: ["businessId", "dayOfWeek"] },
            ],
        });
        return RewardRedeemHour;
    }
}
exports.RewardRedeemHour = RewardRedeemHour;
exports.default = (sequelize) => RewardRedeemHour.initModel(sequelize);
