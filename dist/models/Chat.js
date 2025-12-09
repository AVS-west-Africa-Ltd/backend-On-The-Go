"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const sequelize_1 = require("sequelize");
class Chat extends sequelize_1.Model {
    static associate(models) {
        // 1. Messages Association
        if (models.Message) {
            Chat.hasMany(models.Message, {
                foreignKey: "chatId",
                as: "messages",
                onDelete: "CASCADE",
            });
        }
        // 2. Members Association
        if (models.Member) {
            Chat.hasMany(models.Member, {
                foreignKey: "targetId",
                constraints: false, // Kept from your JS code
                as: "members",
                // Note: You might need 'as: "members"' here if your logic relies on it
            });
        }
        // 3. Profile (Creator) Association
        if (models.Profile) {
            Chat.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "creator",
            });
        }
        // 4. User Association
        if (models.User) {
            Chat.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });
        }
    }
    static initModel(sequelize) {
        Chat.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM("private", "group"),
                defaultValue: "private",
                allowNull: false,
            },
            lastMessageAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                onDelete: "CASCADE",
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
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
            tableName: "chats",
            timestamps: true,
        });
        return Chat;
    }
}
exports.Chat = Chat;
// Export the initializer
exports.default = (sequelize) => Chat.initModel(sequelize);
