import {
    Model,
    DataTypes,
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ModelStatic,
} from "sequelize";
import { VoucherType, VoucherStatus } from "./types/rewardRules.types";

export class Voucher extends Model<
    InferAttributes<Voucher>,
    InferCreationAttributes<Voucher>
> {
    declare id: CreationOptional<number>;
    declare code: string;

    declare userId: number;
    declare businessId: number;
    declare branchId: CreationOptional<number | null>;
    declare description: CreationOptional<string | null>;
    declare validityDays: CreationOptional<string[] | null>;

    declare voucherType: VoucherType;
    declare value: number;

    declare ruleId: CreationOptional<number | null>;

    declare productId: CreationOptional<number | null>;

    declare minOrderAmount: CreationOptional<number>;
    declare maxDiscountAmount: CreationOptional<number | null>;

    declare usageLimit: CreationOptional<number>;
    declare usedCount: CreationOptional<number>;

    declare status: CreationOptional<VoucherStatus>;

    declare validFrom: CreationOptional<Date>;
    declare validUntil: Date;

    declare isStackable: CreationOptional<boolean>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.User) {
            Voucher.belongsTo(models.User, { foreignKey: "userId", as: "user" });
        }
        if (models.Business) {
            Voucher.belongsTo(models.Business, { foreignKey: "businessId", as: "business" });
        }
        if (models.Branch) {
            Voucher.belongsTo(models.Branch, { foreignKey: "branchId", as: "branch" });
        }
        if (models.Product) {
            Voucher.belongsTo(models.Product, { foreignKey: "productId", as: "product" });
        }
        if (models.BusinessRewardRules) {
            Voucher.belongsTo(models.BusinessRewardRules, { foreignKey: "ruleId", as: "rule" });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<Voucher> {
        Voucher.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                code: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true
                },
                ruleId: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                businessId: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                branchId: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                validityDays: {
                    type: DataTypes.JSON,
                    allowNull: true
                },

                voucherType: {
                    type: DataTypes.ENUM(...Object.values(VoucherType)),
                    allowNull: false
                },

                value: {
                    type: DataTypes.FLOAT,
                    allowNull: false
                },

                productId: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },

                minOrderAmount: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0
                },
                maxDiscountAmount: {
                    type: DataTypes.FLOAT,
                    allowNull: true
                },

                usageLimit: {
                    type: DataTypes.INTEGER,
                    defaultValue: 1
                },
                usedCount: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0
                },

                status: {
                    type: DataTypes.ENUM(...Object.values(VoucherStatus)),
                    defaultValue: VoucherStatus.UNUSED
                },

                validFrom: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                },
                validUntil: {
                    type: DataTypes.DATE,
                    allowNull: false
                },

                isStackable: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false
                },

                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false
                },
            },
            {
                sequelize,
                tableName: "vouchers",
                timestamps: true,
            },
        );

        return Voucher;
    }
}

export default (sequelize: Sequelize) => Voucher.initModel(sequelize);
