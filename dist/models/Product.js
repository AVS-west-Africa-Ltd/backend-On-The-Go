"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const sequelize_1 = require("sequelize");
const product_types_1 = require("./types/product.types");
class Product extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            Product.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "amenities",
            });
        }
        if (models.Branch) {
            Product.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
        if (models.BranchAmenity) {
            Product.belongsTo(models.BranchAmenity, {
                foreignKey: "branchAmenityId",
                as: "branch_amenity",
                onDelete: "CASCADE",
            });
        }
        if (models.Media) {
            Product.hasMany(models.Media, {
                foreignKey: "targetId",
                as: "media",
                scope: { targetType: "product" },
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        Product.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
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
            branchAmenityId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            price: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(product_types_1.ProductStatus)),
                allowNull: true,
                defaultValue: "available",
            },
            rating: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            meta: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
            },
            isDeleted: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            deletedAt: {
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
            tableName: "products",
            paranoid: true,
            timestamps: true,
            indexes: [
                { fields: ["businessId"] },
                {
                    unique: true,
                    fields: ["businessId", "name"],
                },
            ],
        });
        return Product;
    }
}
exports.Product = Product;
exports.default = (sequelize) => Product.initModel(sequelize);
