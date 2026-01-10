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
import { BranchStaffAttributes, BranchStaffRole } from "./types/branchStaff.types";
import { User } from "./User";
import { Branch } from "./Branch";
import { Profile } from "./Profile";

export class BranchStaff extends Model<
  InferAttributes<BranchStaff>,
  InferCreationAttributes<BranchStaff>
> implements BranchStaffAttributes {
  declare id: CreationOptional<string>;
  declare userId: number | null;
  declare businessId: number;
  declare branchId: number;
  declare firstName: string;
  declare lastName: string;
  // declare fullName: string;
  declare email: string;
  declare role: BranchStaffRole;
  declare isActive: CreationOptional<boolean>;
  declare lastLogin: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare branch?: NonAttribute<Branch>;
  declare business?: NonAttribute<Profile>;
  declare user?: NonAttribute<User>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Branch) {
      BranchStaff.belongsTo(models.Branch, {
        foreignKey: "branchId",
        as: "branch",
        onDelete: "CASCADE",
      });
    }

    if (models.Profile) {
      BranchStaff.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "business",
      });
    }

    if (models.User) {
      BranchStaff.belongsTo(models.User, {
        foreignKey: "userId",
        as: "account",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<BranchStaff> {
    BranchStaff.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        businessId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        branchId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        firstName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { isEmail: true },
        },

        role: {
          type: DataTypes.ENUM(...Object.values(BranchStaffRole)),
          allowNull: false,
        },

        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },

        lastLogin: {
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
        tableName: "branch_staff",
        timestamps: true,
        indexes: [
          { unique: true, fields: ["email", "branchId"] },
          { fields: ["branchId"] },
          { fields: ["businessId"] },
        ],
      }
    );

    return BranchStaff;
  }
}

export default (sequelize: Sequelize) => BranchStaff.initModel(sequelize);
