"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const sequelize_1 = require("sequelize");
class Message extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Message.belongsTo(models.User, {
                foreignKey: "senderId",
                as: "sender",
            });
        }
        if (models.Chat) {
            Message.belongsTo(models.Chat, {
                foreignKey: "chatId",
                as: "chat",
            });
        }
    }
    static initModel(sequelize) {
        Message.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            chatId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
            },
            senderId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            content: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
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
            tableName: "messages",
            timestamps: true,
        });
        return Message;
    }
}
exports.Message = Message;
exports.default = (sequelize) => Message.initModel(sequelize);
