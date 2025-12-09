"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpeningHour = void 0;
// models/openingHour.model.ts
const sequelize_1 = require("sequelize");
class OpeningHour extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            OpeningHour.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "businessProfile",
            });
        }
        if (models.Branch) {
            OpeningHour.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        OpeningHour.init({
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
            branchId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            dayOfWeek: {
                type: sequelize_1.DataTypes.ENUM("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"),
                allowNull: false,
            },
            openTime: {
                type: sequelize_1.DataTypes.TIME,
                allowNull: true,
                comment: "Business opening time (HH:mm:ss)",
            },
            closeTime: {
                type: sequelize_1.DataTypes.TIME,
                allowNull: true,
                comment: "Business closing time (HH:mm:ss)",
            },
            isClosed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                comment: "Mark true if closed on this day",
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
            tableName: "opening_hours",
            timestamps: true,
            indexes: [
                { fields: ["businessId", "branchId"] },
                { unique: true, fields: ["branchId", "dayOfWeek"] },
            ],
        });
        return OpeningHour;
    }
}
exports.OpeningHour = OpeningHour;
// Export default function that initializes the model
exports.default = (sequelize) => OpeningHour.initModel(sequelize);
