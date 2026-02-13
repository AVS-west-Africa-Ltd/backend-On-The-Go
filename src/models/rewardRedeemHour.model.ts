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

export class RewardRedeemHour extends Model<
  InferAttributes<RewardRedeemHour>,
  InferCreationAttributes<RewardRedeemHour>
> {
  declare id: CreationOptional<number>;
  declare businessId: number;
  declare dayOfWeek:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  declare openTime: string;
  declare closeTime: string;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare businessProfile?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      RewardRedeemHour.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "businessProfile",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<RewardRedeemHour> {
    RewardRedeemHour.init(
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
          allowNull: false,
          comment: "Business opening time (HH:mm:ss)",
        },
        closeTime: {
          type: DataTypes.TIME,
          allowNull: false,
          comment: "Business closing time (HH:mm:ss)",
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
        tableName: "reward_redeem_hours",
        timestamps: true,
        indexes: [
          { fields: ["businessId"] },
          { unique: true, fields: ["businessId", "dayOfWeek"] },
        ],
      }
    );

    return RewardRedeemHour;
  }
}

export default (sequelize: Sequelize) => RewardRedeemHour.initModel(sequelize);