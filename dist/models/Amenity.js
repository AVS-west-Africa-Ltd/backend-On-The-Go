"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Amenity = void 0;
const sequelize_1 = require("sequelize");
const amenity_types_1 = require("./types/amenity.types");
class Amenity extends sequelize_1.Model {
    static associate(models) {
    }
    static initModel(sequelize) {
        Amenity.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.ENUM(...Object.values(amenity_types_1.AmenityCategory)),
                allowNull: false,
                unique: true,
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
            tableName: "amenities",
            timestamps: true,
        });
        return Amenity;
    }
}
exports.Amenity = Amenity;
// Export default function that initializes the model
exports.default = (sequelize) => Amenity.initModel(sequelize);
