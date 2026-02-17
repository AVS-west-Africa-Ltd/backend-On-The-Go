import {
    Model,
    DataTypes,
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ModelStatic,
} from "sequelize";
import { RewardTriggerType, VoucherType } from "./types/rewardRules.types";

export class BusinessRewardRules extends Model<
    InferAttributes<BusinessRewardRules>,
    InferCreationAttributes<BusinessRewardRules>
> {
    declare id: CreationOptional<number>;
    declare businessId: number;
    declare branchId: CreationOptional<number | null>;
    declare name: CreationOptional<string | null>;
    declare validityDays: CreationOptional<string[] | null>;

    declare triggerType: RewardTriggerType;
    declare threshold: number;

    declare voucherType: VoucherType;
    declare value: number;

    declare expiryHours: number;
    declare maxPerUser: number;
    declare isActive: CreationOptional<boolean>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Business) {
            BusinessRewardRules.belongsTo(models.Business, {
                foreignKey: "businessId",
                as: "business",
            });
        }
        if (models.Branch) {
            BusinessRewardRules.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<BusinessRewardRules> {
        BusinessRewardRules.init(
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
                    allowNull: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                validityDays: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                triggerType: {
                    type: DataTypes.ENUM(...Object.values(RewardTriggerType)),
                    allowNull: false,
                },
                threshold: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 1,
                },
                voucherType: {
                    type: DataTypes.ENUM(...Object.values(VoucherType)),
                    allowNull: false,
                },
                value: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                },
                expiryHours: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 24,
                },
                maxPerUser: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 5,
                },
                isActive: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE,
            },
            {
                sequelize,
                tableName: "business_reward_rules",
                timestamps: true,
            }
        );

        return BusinessRewardRules;
    }
}

export default (sequelize: Sequelize) => BusinessRewardRules.initModel(sequelize);
