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
import { Post } from "./post.model";
import { Profile } from "./profile.model";
import { MediaTargetTypes, TMediaTargetType } from "./types/media.types";

export type MediaTargetType =
  | "profile"
  | "post"
  | "business"
  | "product"
  | "review";

export class Media extends Model<
  InferAttributes<Media>,
  InferCreationAttributes<Media>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare targetId: number;
  declare targetType: TMediaTargetType;
  declare filePath: string;
  declare fileName: CreationOptional<string | null>;
  declare mimeType: CreationOptional<string | null>;
  declare metadata: CreationOptional<Record<string, any> | null>;
  declare isActive: CreationOptional<boolean>;
  declare uploadOrder: CreationOptional<number>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date>; // Paranoid is true

  // Associations
  declare post?: NonAttribute<Post>;
  declare profile?: NonAttribute<Profile>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Post) {
      Media.belongsTo(models.Post, {
        foreignKey: "targetId",
        constraints: false,
        as: "post",
        scope: { targetType: "post" },
      });
    }

    if (models.Profile) {
      Media.belongsTo(models.Profile, {
        foreignKey: "targetId",
        constraints: false,
        as: "profile",
        scope: { targetType: "profile" },
      });
    }

    if (models.Product) {
      Media.belongsTo(models.Product, {
        foreignKey: "targetId",
        constraints: false,
        as: "product",
        scope: { targetType: "product" },
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Media> {
    Media.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false, 
        },
        targetId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notNull: { msg: "Target ID is required" },
            isInt: { msg: "Target ID must be an integer" },
          },
        },
        targetType: {
          type: DataTypes.ENUM(...Object.values(MediaTargetTypes)),
          allowNull: false,
          validate: {
            notNull: { msg: "Target type is required" },
            isIn: {
              args: [["profile", "post", "business", "product", "review"]],
              msg: "Target type must be one of: profile, post, business, product, review",
            },
          },
        },
        filePath: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: { msg: "File path is required" },
            notEmpty: { msg: "File path cannot be empty" },
            isUrl: {
              msg: "File path should be a valid URL or path",
              // args: { require_protocol: false }, // Typescript might complain about args here depending on sequelize version
            },
          },
        },
        fileName: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            notEmpty: { msg: "File name cannot be empty if provided" },
          },
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            notEmpty: { msg: "MIME type cannot be empty if provided" },
          },
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        uploadOrder: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          validate: {
            min: { args: [0], msg: "Upload order cannot be negative" },
          },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
      },
      {
        sequelize,
        tableName: "media",
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            name: "idx_media_target",
            fields: ["targetType", "targetId"],
          },
          {
            name: "idx_media_upload_order",
            fields: ["targetType", "targetId", "uploadOrder"],
          },
          {
            name: "idx_media_active",
            fields: ["isActive"],
          },
        ],
      }
    );

    return Media;
  }
}

export default (sequelize: Sequelize) => Media.initModel(sequelize);