import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  ModelStatic,
} from "sequelize";

export type DocumentType =
  | "certificate_of_incorporation"
  | "tax_identification"
  | "utility_bill"
  | "business_license"
  | "other"
  | "cac"
  | "bank_statment";

export type DocumentStatus = "pending" | "approved" | "rejected";

export class Document extends Model<
  InferAttributes<Document>,
  InferCreationAttributes<Document>
> {
  declare id: CreationOptional<number>;
  declare profileId: number;
  declare documentType: DocumentType;
  declare fileUrl: string;
  declare fileKey: CreationOptional<string | null>;
  declare status: CreationOptional<DocumentStatus>;
  declare verifiedAt: CreationOptional<Date | null>;
  declare notes: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare profile?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      Document.belongsTo(models.Profile, {
        foreignKey: "profileId",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Document> {
    Document.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        documentType: {
          type: DataTypes.ENUM(
            "certificate_of_incorporation",
            "tax_identification",
            "utility_bill",
            "business_license",
            "other",
            "cac",
            "bank_statment"
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
          defaultValue: null,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: "Admin notes on rejection/approval",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "documents",
        timestamps: true,
        indexes: [
          { fields: ["profileId"] },
          { fields: ["documentType"] },
          { fields: ["status"] },
        ],
      }
    );

    return Document;
  }
}

export default (sequelize: Sequelize) => Document.initModel(sequelize);