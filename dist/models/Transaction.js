"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const sequelize_1 = require("sequelize");
class Transaction extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Transaction.belongsTo(models.User, {
                foreignKey: "userId",
            });
        }
    }
    static initModel(sequelize) {
        Transaction.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            reference: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            businessId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            ticketId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            amount: {
                type: sequelize_1.DataTypes.DOUBLE,
                allowNull: false,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM("pending", "completed"),
                allowNull: false,
                defaultValue: "pending",
            },
            hotspotTicket: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: {},
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
            tableName: "transactions",
            timestamps: true,
        });
        return Transaction;
    }
}
exports.Transaction = Transaction;
exports.default = (sequelize) => Transaction.initModel(sequelize);
