"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = void 0;
const sequelize_1 = require("sequelize");
class Location extends sequelize_1.Model {
    static associate(models) {
    }
    static initModel(sequelize) {
        Location.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            lat: {
                type: sequelize_1.DataTypes.DOUBLE,
                allowNull: false,
            },
            lon: {
                type: sequelize_1.DataTypes.DOUBLE,
                allowNull: false,
            },
            icon: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            types: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            vicinity: {
                type: sequelize_1.DataTypes.TEXT,
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
            tableName: "locations",
            timestamps: true,
        });
        return Location;
    }
}
exports.Location = Location;
exports.default = (sequelize) => Location.initModel(sequelize);
