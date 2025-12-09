"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const sequelize_1 = require("sequelize");
class Profile extends sequelize_1.Model {
    static associate(models) {
        if (models.User) {
            Profile.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });
        }
        if (models.Comment) {
            Profile.hasMany(models.Comment, {
                foreignKey: "profileId",
                as: "comments",
            });
        }
        if (models.NetworkRouter) {
            Profile.hasOne(models.NetworkRouter, {
                foreignKey: "profileId",
            });
        }
        if (models.TicketProfile) {
            Profile.hasMany(models.TicketProfile, {
                foreignKey: "profileId",
            });
        }
        if (models.Amenity) {
            Profile.hasMany(models.Amenity, {
                foreignKey: "businessId",
                as: "amenities",
                onDelete: "CASCADE",
            });
        }
        if (models.Post) {
            Profile.hasMany(models.Post, {
                foreignKey: "profileId",
                as: "posts",
                onDelete: "CASCADE",
            });
            Profile.hasMany(models.Post, {
                foreignKey: "reviewTarget",
                as: "reviews",
                onDelete: "CASCADE",
            });
        }
        if (models.Social) {
            Profile.hasMany(models.Social, {
                foreignKey: "businessId",
                as: "socials",
                onDelete: "CASCADE",
            });
        }
        if (models.Media) {
            Profile.hasMany(models.Media, {
                foreignKey: "targetId",
                as: "media",
                constraints: false,
                // scopes handled at query time or default scope
            });
        }
    }
    static initModel(sequelize) {
        Profile.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            profileType: {
                type: sequelize_1.DataTypes.ENUM("personal", "business"),
                allowNull: false,
                defaultValue: "personal",
            },
            businessType: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                defaultValue: "",
            },
            userName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            picture: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            bio: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            interests: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            profession: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            skills: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            gender: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            isStudent: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
            },
            closeUniversity: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
            },
            fullAddress: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            streetAddress: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            state: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            country: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            city: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            geoLocation: {
                type: sequelize_1.DataTypes.GEOMETRY("POINT"),
                allowNull: true,
            },
            followers: {
                type: sequelize_1.DataTypes.INTEGER,
                defaultValue: 0,
            },
            following: {
                type: sequelize_1.DataTypes.INTEGER,
                defaultValue: 0,
            },
            cacNo: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            website: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            rating: {
                type: sequelize_1.DataTypes.FLOAT,
                defaultValue: 0,
            },
            businessCategory: {
                type: sequelize_1.DataTypes.ENUM("sme", "large_enterprise"),
                allowNull: true,
                defaultValue: null,
            },
            placesVisited: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
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
            tableName: "profiles",
            timestamps: true,
            indexes: [{ fields: ["userId"] }, { fields: ["profileType"] }],
        });
        return Profile;
    }
}
exports.Profile = Profile;
exports.default = (sequelize) => Profile.initModel(sequelize);
