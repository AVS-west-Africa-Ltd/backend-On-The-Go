import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
  NonAttribute,
} from "sequelize";
import { ProductStatus, TProductStatus } from "./types/product.types";
import { BranchAmenity } from "./branchAmenity.model";
import { Media } from "./media.model";
import { Amenity } from "./amenity.model";


export class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: CreationOptional<number>;
  declare businessId: number;
  declare branchId: number;
  declare branchAmenityId: string;
  declare name: string;
  declare description: string;
  declare price: number;
  declare currency: CreationOptional<string>;
  declare status: CreationOptional<TProductStatus>;
  declare rating: CreationOptional<number | null>;
  declare isFeatured: CreationOptional<boolean>;
  declare isWifiTicket: CreationOptional<boolean>;
  declare meta: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare isDeleted: CreationOptional<boolean>;
  declare deletedAt: CreationOptional<Date>;

  declare media?: NonAttribute<Media[]>;
  // declare branch_amenity?: NonAttribute<BranchAmenity>;
  declare branch_amenity: NonAttribute<BranchAmenity & { amenity: Amenity }>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      Product.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "amenities",
      });
    }

    if (models.Branch) {
      Product.belongsTo(models.Branch, {
        foreignKey: "branchId",
        as: "branch",
        onDelete: "CASCADE",
      });
    }

    if (models.BranchAmenity) {
      Product.belongsTo(models.BranchAmenity, {
        foreignKey: "branchAmenityId",
        as: "branch_amenity",
        onDelete: "CASCADE",
      });
    }

    if (models.Media) {
      Product.hasMany(models.Media, {
        foreignKey: "targetId",
        as: "media",
        scope: { targetType: "product" },
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Product> {
    Product.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        businessId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        branchId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        branchAmenityId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        price: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: "NGN",
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ProductStatus)),
          allowNull: true,
          defaultValue: "available",
        },
        rating: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        isFeatured: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        isWifiTicket: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        meta: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
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
        tableName: "products",
        paranoid: true,
        timestamps: true,
        indexes: [
          { fields: ["businessId", "branchId"] },
          {
            unique: true,
            fields: ["branchId", "name"],
          },
        ],
      }
    );

    return Product;
  }
}

export default (sequelize: Sequelize) => Product.initModel(sequelize);
