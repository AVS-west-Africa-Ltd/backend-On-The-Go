"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Branch = void 0;
// models/branch.model.ts
const sequelize_1 = require("sequelize");
const amenity_types_1 = require("./types/amenity.types");
class Branch extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            Branch.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
                onDelete: "CASCADE",
            });
        }
        if (models.BranchAmenity) {
            Branch.hasMany(models.BranchAmenity, {
                foreignKey: "branchId",
                as: "branch_amenities",
                onDelete: "CASCADE",
            });
        }
        Branch.hasMany(models.BranchStaff, {
            foreignKey: "branchId",
            as: "staff",
            onDelete: "CASCADE",
        });
        Branch.hasMany(models.Product, {
            foreignKey: "branchId",
            as: "products",
            onDelete: "CASCADE",
        });
        if (models.OpeningHour) {
            Branch.hasMany(models.OpeningHour, {
                foreignKey: "branchId",
                as: "openingHours",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        Branch.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "profiles",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    len: {
                        args: [2, 100],
                        msg: "Branch name must be between 2 and 100 characters",
                    },
                },
            },
            fullAddress: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            streetAddress: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
            },
            state: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            country: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            city: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            ratingCount: {
                type: sequelize_1.DataTypes.FLOAT,
                defaultValue: 0,
            },
            reviewCount: {
                type: sequelize_1.DataTypes.FLOAT,
                defaultValue: 0,
            },
            geoLocation: {
                type: sequelize_1.DataTypes.GEOMETRY("POINT"),
                allowNull: true,
            },
            isHQ: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(amenity_types_1.Status)),
                allowNull: false,
                defaultValue: "active",
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
            tableName: "branches",
            timestamps: true,
            indexes: [
                { fields: ["profileId"] },
                { unique: true, fields: ["profileId", "name"] }
            ],
        });
        return Branch;
    }
}
exports.Branch = Branch;
exports.default = (sequelize) => Branch.initModel(sequelize);
