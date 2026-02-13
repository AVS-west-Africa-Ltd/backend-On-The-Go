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
import { Profile } from "./profile.model";

// If you want to separate types, put this in types/user.types.ts
// otherwise, InferAttributes<User> handles it automatically.
export interface UserAttributes {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone_number: string;
  pushToken?: string | null;
  referralCode?: string | null;
  successfulReferrals?: number;
  verificationCode?: string | null;
  verificationExpires?: Date | null;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> implements UserAttributes {
  declare id: CreationOptional<number>;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare password: string;
  declare phone_number: string;
  declare pushToken: CreationOptional<string | null>;
  declare referralCode: CreationOptional<string | null>;
  declare successfulReferrals: CreationOptional<number>;
  declare verificationCode: CreationOptional<string | null>;
  declare verificationExpires: CreationOptional<Date | null>;
  declare isVerified: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare profiles?: NonAttribute<Profile[]>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      User.hasMany(models.Profile, {
        foreignKey: "userId",
        as: "profiles",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<User> {
    User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        phone_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        pushToken: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        referralCode: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: true,
        },
        successfulReferrals: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        verificationCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        verificationExpires: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
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
        tableName: "users",
        timestamps: true,
        indexes: [
          { unique: true, fields: ["email"] },
          { unique: true, fields: ["phone_number"] },
        ],
      }
    );

    return User;
  }
}

export default (sequelize: Sequelize) => User.initModel(sequelize);