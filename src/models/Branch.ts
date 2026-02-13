// models/branch.model.ts
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
import { BranchAttributes } from "./types/branch.types";
import { BranchAmenity } from "./BranchAmenity";
import { OpeningHour } from "./OpeningHour";
import { Profile } from "./Profile";
import { BranchStaff } from "./BranchStaff";
import { Product } from "./Product";
import { Status, TStatus } from "./types/amenity.types";
import { Order } from "./Order";
import { Post } from "./Post";
import { Media } from "./Media";
import { MikrotikRouter } from "./MikrotikRouter";
import { Admin } from "./Admin";



export class Branch extends Model<
  InferAttributes<Branch>,
  InferCreationAttributes<Branch>
> implements BranchAttributes {
  declare id: CreationOptional<number>;
  declare profileId: number;
  declare name: string;
  declare fullAddress: CreationOptional<string | null>;
  declare description: CreationOptional<string | null>;
  declare streetAddress: CreationOptional<string | null>;
  declare state: CreationOptional<string | null>;
  declare country: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare ratingCount: CreationOptional<number>;
  declare reviewCount: CreationOptional<number>;
  declare rating: CreationOptional<number>;
  declare followers: CreationOptional<number>;
  declare status: TStatus;
  declare geoLocation: CreationOptional<{ type: string; coordinates: [number, number] } | null>;
  declare isHQ: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare amenities?: NonAttribute<BranchAmenity[]>;
  declare openingHours?: NonAttribute<OpeningHour[]>;
  declare profile?: NonAttribute<Profile>;
  declare staff?: NonAttribute<BranchStaff[]>;
  declare products?: NonAttribute<Product[]>;
  declare orders?: NonAttribute<Order[]>;
  declare posts?: NonAttribute<Post[]>;
  declare media?: NonAttribute<Media[]>;
  declare networkRouter?: NonAttribute<MikrotikRouter>;
  declare admins?: NonAttribute<Admin[]>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      Branch.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "CASCADE",
      });
    }

    if (models.BranchAmenity) {
      Branch.hasMany(models.BranchAmenity, {
        foreignKey: "branchId",
        as: "branch_amenities",
        onDelete: "CASCADE",
      });
    }

    if (models.BranchStaff) {
      Branch.hasMany(models.BranchStaff, {
        foreignKey: "branchId",
        as: "staff",
        onDelete: "CASCADE",
      });
    }

    if (models.Product) {
      Branch.hasMany(models.Product, {
        foreignKey: "branchId",
        as: "products",
        onDelete: "CASCADE",
      });
    }

    if (models.OpeningHour) {
      Branch.hasMany(models.OpeningHour, {
        foreignKey: "branchId",
        as: "openingHours",
        onDelete: "CASCADE",
      });
    }

    if (models.Order) {
      Branch.hasMany(models.Order, {
        foreignKey: "branchId",
        as: "orders",
        onDelete: "CASCADE",
      });
    }

    if (models.Post) {
      Branch.hasMany(models.Post, {
        foreignKey: "branchId",
        as: "posts",
        onDelete: "CASCADE",
      });
    }

    if (models.Media) {
      Branch.hasMany(models.Media, {
        foreignKey: "branchId",
        as: "media",
        onDelete: "CASCADE",
      });
    }

    if (models.MikrotikRouter) {
      Branch.hasOne(models.MikrotikRouter, {
        foreignKey: "branchId",
        as: "networkRouter",
        onDelete: "CASCADE",
      });
    }
    if (models.Admin) {
      Branch.hasMany(models.Admin, {
        foreignKey: "branchId",
        as: "admins",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Branch> {
    Branch.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "profiles",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            len: {
              args: [2, 100],
              msg: "Branch name must be between 2 and 100 characters",
            },
          },
        },
        fullAddress: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        streetAddress: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        ratingCount: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        reviewCount: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        rating: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        followers: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        geoLocation: {
          type: DataTypes.GEOMETRY("POINT"),
          allowNull: true,
        },
        isHQ: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(Status)),
          allowNull: false,
          defaultValue: "active",
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
        tableName: "branches",
        timestamps: true,
        indexes: [
          { fields: ["profileId"] },
          { unique: true, fields: ["profileId", "name"] }
        ],
      }
    );

    return Branch;
  }
}

export default (sequelize: Sequelize) => Branch.initModel(sequelize);