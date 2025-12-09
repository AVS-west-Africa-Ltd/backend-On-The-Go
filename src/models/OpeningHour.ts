// models/openingHour.model.ts
import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
} from "sequelize";
import { DayOfWeek } from "./types/openingHour.types";

export interface OpeningHourAttributes {
  id?: number;
  businessId: number;
  branchId: number;
  dayOfWeek: DayOfWeek;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OpeningHour extends Model<
  InferAttributes<OpeningHour>,
  InferCreationAttributes<OpeningHour>
> implements OpeningHourAttributes {
  declare id: CreationOptional<number>;
  declare businessId: number;
  declare branchId: number;
  declare dayOfWeek: DayOfWeek;
  declare openTime: CreationOptional<string | null>;
  declare closeTime: CreationOptional<string | null>;
  declare isClosed: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      OpeningHour.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "businessProfile",
      });
    }

    if (models.Branch) {
      OpeningHour.belongsTo(models.Branch, {
        foreignKey: "branchId",
        as: "branch",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<OpeningHour> {
    OpeningHour.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        businessId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          onDelete: "CASCADE",
        },
        branchId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        dayOfWeek: {
          type: DataTypes.ENUM(
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
          ),
          allowNull: false,
        },
        openTime: {
          type: DataTypes.TIME,
          allowNull: true,
          comment: "Business opening time (HH:mm:ss)",
        },
        closeTime: {
          type: DataTypes.TIME,
          allowNull: true,
          comment: "Business closing time (HH:mm:ss)",
        },
        isClosed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: "Mark true if closed on this day",
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
        tableName: "opening_hours",
        timestamps: true,
        indexes: [
          { fields: ["businessId", "branchId"] },
          { unique: true, fields: ["branchId", "dayOfWeek"] },
        ],
      }
    );

    return OpeningHour;
  }
}

// Export default function that initializes the model
export default (sequelize: Sequelize) => OpeningHour.initModel(sequelize);