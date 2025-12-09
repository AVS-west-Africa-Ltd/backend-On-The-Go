"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchAmenity = void 0;
const sequelize_1 = require("sequelize");
const amenity_types_1 = require("./types/amenity.types");
class BranchAmenity extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            BranchAmenity.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "amenities",
            });
        }
        if (models.Branch) {
            BranchAmenity.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
        if (models.Amenity) {
            BranchAmenity.belongsTo(models.Amenity, {
                foreignKey: "amenityId",
                as: "amenity",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        BranchAmenity.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            businessId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            branchId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            amenityId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(amenity_types_1.Status)),
                allowNull: false,
                defaultValue: amenity_types_1.Status.ACTIVE,
            },
            rating: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            totalRating: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            ratingCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            meta: {
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
            tableName: "branch_amenities",
            timestamps: true,
            indexes: [
                { fields: ["businessId"] },
                {
                    unique: true,
                    fields: ["businessId", "branchId", "amenityId"],
                },
            ],
        });
        return BranchAmenity;
    }
}
exports.BranchAmenity = BranchAmenity;
// Export default function that initializes the model
exports.default = (sequelize) => BranchAmenity.initModel(sequelize);
