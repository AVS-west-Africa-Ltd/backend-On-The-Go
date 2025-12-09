"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkRouter = void 0;
const sequelize_1 = require("sequelize");
class NetworkRouter extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            NetworkRouter.belongsTo(models.User, {
                foreignKey: "userId",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        NetworkRouter.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            host: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            username: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            password: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            port: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 8728,
            },
            ssl: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
            },
            metadata: {
                type: sequelize_1.DataTypes.JSON,
                defaultValue: {
                    status: "new",
                    items: [],
                },
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onDelete: "CASCADE",
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
            tableName: "networkRouters",
            timestamps: true,
        });
        return NetworkRouter;
    }
}
exports.NetworkRouter = NetworkRouter;
exports.default = (sequelize) => NetworkRouter.initModel(sequelize);
