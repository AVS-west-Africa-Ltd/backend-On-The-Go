"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketProfile = void 0;
const sequelize_1 = require("sequelize");
class TicketProfile extends sequelize_1.Model {
    static associate(models) {
        if (models.NetworkRouter) {
            TicketProfile.belongsTo(models.NetworkRouter, {
                foreignKey: "routerId",
                onDelete: "CASCADE",
            });
        }
        if (models.User) {
            TicketProfile.belongsTo(models.User, {
                foreignKey: "userId",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        TicketProfile.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            price: {
                type: sequelize_1.DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            routerId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "networkRouters",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            owner: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: "",
            },
            title: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: "",
            },
            description: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: "",
            },
            bandwidth: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: "",
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
            tableName: "ticketProfiles",
            timestamps: true,
        });
        return TicketProfile;
    }
}
exports.TicketProfile = TicketProfile;
exports.default = (sequelize) => TicketProfile.initModel(sequelize);
