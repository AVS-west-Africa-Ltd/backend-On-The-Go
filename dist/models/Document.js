"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const sequelize_1 = require("sequelize");
class Document extends sequelize_1.Model {
    static associate(models) {
        if (models.Profile) {
            Document.belongsTo(models.Profile, {
                foreignKey: "profileId",
            });
        }
    }
    static initModel(sequelize) {
        Document.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            profileId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            documentType: {
                type: sequelize_1.DataTypes.ENUM("certificate_of_incorporation", "tax_identification", "utility_bill", "business_license", "other", "cac", "bank_statment"),
                allowNull: false,
            },
            fileUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                comment: "S3 URL or file path",
            },
            fileKey: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                comment: "S3 object key for easy deletion",
            },
            status: {
                type: sequelize_1.DataTypes.ENUM("pending", "approved", "rejected"),
                defaultValue: "pending",
            },
            verifiedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                defaultValue: null,
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: "Admin notes on rejection/approval",
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
            tableName: "documents",
            timestamps: true,
            indexes: [
                { fields: ["profileId"] },
                { fields: ["documentType"] },
                { fields: ["status"] },
            ],
        });
        return Document;
    }
}
exports.Document = Document;
exports.default = (sequelize) => Document.initModel(sequelize);
