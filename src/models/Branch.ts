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

     Branch.hasMany(models.BranchStaff, {
      foreignKey: "branchId",
      as: "staff",
      onDelete: "CASCADE",
    });

     Branch.hasMany(models.Product, {
      foreignKey: "branchId",
      as: "products",
      onDelete: "CASCADE",
    });

    if (models.OpeningHour) {
      Branch.hasMany(models.OpeningHour, {
        foreignKey: "branchId",
        as: "openingHours",
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