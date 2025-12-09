"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchStaff = void 0;
const sequelize_1 = require("sequelize");
const branchStaff_types_1 = require("./types/branchStaff.types");
class BranchStaff extends sequelize_1.Model {
    static associate(models) {
        if (models.Branch) {
            BranchStaff.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
        if (models.Profile) {
            BranchStaff.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "business",
            });
        }
        if (models.User) {
            BranchStaff.belongsTo(models.User, {
                foreignKey: "userId",
                as: "account",
            });
        }
    }
    static initModel(sequelize) {
        BranchStaff.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            businessId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            branchId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            fullName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                validate: { isEmail: true },
                unique: true,
            },
            role: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(branchStaff_types_1.BranchStaffRole)),
                allowNull: false,
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            lastLogin: {
                type: sequelize_1.DataTypes.DATE,
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
            tableName: "branch_staff",
            timestamps: true,
            indexes: [
                { fields: ["email"], unique: true },
                { fields: ["branchId"] },
                { fields: ["businessId"] },
            ],
        });
        return BranchStaff;
    }
}
exports.BranchStaff = BranchStaff;
exports.default = (sequelize) => BranchStaff.initModel(sequelize);
