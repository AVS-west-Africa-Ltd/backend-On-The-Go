"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
class User extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            User.hasMany(models.Profile, {
                foreignKey: "userId",
                as: "profiles",
                onDelete: "CASCADE",
            });
        }
    }
    static initModel(sequelize) {
        User.init({
            // id: {
            //   type: DataTypes.INTEGER,
            //   autoIncrement: true,
            //   primaryKey: true,
            // },
            firstName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            phone_number: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            pushToken: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            referralCode: {
                type: sequelize_1.DataTypes.STRING,
                unique: true,
                allowNull: true,
            },
            successfulReferrals: {
                type: sequelize_1.DataTypes.INTEGER,
                defaultValue: 0,
            },
            verificationCode: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            verificationExpires: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            isVerified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
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
            tableName: "users",
            timestamps: true,
            indexes: [
                { unique: true, fields: ["email"] },
                { unique: true, fields: ["phone_number"] },
            ],
        });
        return User;
    }
}
exports.User = User;
exports.default = (sequelize) => User.initModel(sequelize);
