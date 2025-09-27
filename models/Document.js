// models/businessDocument.js
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    "Document",
    {

      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Profile",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      documentType: {
        type: DataTypes.ENUM(
          "certificate_of_incorporation",
          "tax_identification",
          "utility_bill",
          "business_license",
          "other",
          "cac"
        ),
        allowNull: false,
      },

      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "S3 URL or file path",
      },

      fileKey: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "S3 object key for easy deletion",
      },

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },

      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Admin notes on rejection/approval",
      },
    },
    {
      tableName: "documents",
      timestamps: true,
      indexes: [
        { fields: ["businessId"] },
        { fields: ["documentType"] },
        { fields: ["status"] },
      ],
    }
  );

  BusinessDocument.associate = (models) => {
    BusinessDocument.belongsTo(models.Profile, {
      foreignKey: "businessId",
      as: "businessProfile",
    });
  };

  return Document;
};
