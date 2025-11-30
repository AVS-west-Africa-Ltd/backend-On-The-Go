"use strict";
// module.exports = (sequelize, DataTypes) => {
//   const Amenity = sequelize.define(
//     "Amenity",
//     {
//       userId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
Object.defineProperty(exports, "__esModule", { value: true });
exports.Amenity = void 0;
//       businessId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       branchId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       name: {
//         type: DataTypes.ENUM("wifi", "coffee"),
//         allowNull: false,
//       },
//       rating: {
//         type: DataTypes.FLOAT,
//         allowNull: true,
//       },
//       meta: {
//         type: DataTypes.JSON,
//         allowNull: true,
//         validate: {
//           isValidMeta(value) {
//             if (value && typeof value === "object") {
//               const allowedKeys = ["name", "password"];
//               const invalidKeys = Object.keys(value).filter(
//                 (key) => !allowedKeys.includes(key)
//               );
//               if (invalidKeys.length > 0) {
//                 throw new Error(
//                   `Invalid meta keys: ${invalidKeys.join(", ")}. Allowed: ${allowedKeys.join(", ")}`
//                 );
//               }
//             }
//           },
//         },
//         comment: "Allowed keys: name, password for Wi-Fi; may expand for future amenities",
//       },
//     },
//     {
//       tableName: "amenities",
//       timestamps: true,
//       indexes: [
//         { fields: ["businessId"] },
//         {
//           unique: true,
//           fields: ["businessId", "name"],
//         },
//       ],
//     },
//   );
//   Amenity.associate = (models) => {
//     Amenity.belongsTo(models.Profile, { foreignKey: "businessId", as: "amenities" });
//   };
//   return Amenity;
// };
// models/amenity.model.ts
const sequelize_1 = require("sequelize");
/**
 * Model class
 */
class Amenity extends sequelize_1.Model {
    // Associate - will be filled by models/index.ts after loader runs
    static associate(models) {
        // example: Amenity belongsTo Profile via businessId (adjust as your app uses)
        if (models.Profile) {
            Amenity.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "amenities",
            });
        }
    }
    static initModel(sequelize) {
        Amenity.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            businessId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            branchId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            name: {
                type: sequelize_1.DataTypes.ENUM("wifi", "coffee"),
                allowNull: false,
            },
            rating: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            meta: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: "Allowed keys: name, password for Wi-Fi; may expand for future amenities",
                validate: {
                    isValidMeta(value) {
                        if (!value)
                            return;
                        if (typeof value !== "object" || Array.isArray(value)) {
                            throw new Error("meta must be an object");
                        }
                        const allowedKeys = ["name", "password"];
                        const invalidKeys = Object.keys(value).filter((k) => !allowedKeys.includes(k));
                        if (invalidKeys.length > 0) {
                            throw new Error(`Invalid meta keys: ${invalidKeys.join(", ")}. Allowed: ${allowedKeys.join(", ")}`);
                        }
                    },
                },
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
            indexes: [
                { fields: ["businessId"] },
                {
                    unique: true,
                    fields: ["businessId", "name"],
                },
            ],
        });
        return Amenity;
    }
}
exports.Amenity = Amenity;
exports.default = Amenity;
