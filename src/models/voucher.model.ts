import {
    Model,
    DataTypes,
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ModelStatic,
} from "sequelize";

export class Voucher extends Model<
    InferAttributes<Voucher>,
    InferCreationAttributes<Voucher>
> {
    declare id: CreationOptional<number>;
    declare code: string;
    declare discountType: CreationOptional<string>; // 'PERCENTAGE'
    declare value: number;
    declare userId: number;
    declare businessId: number;
    declare branchId: CreationOptional<number | null>;
    declare status: CreationOptional<string>; // 'UNUSED', 'USED', 'EXPIRED'
    declare validFrom: CreationOptional<Date>;
    declare validUntil: CreationOptional<Date>;
    declare minOrderAmount: CreationOptional<number>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.User) {
            Voucher.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<Voucher> {
        Voucher.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                code: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                },
                discountType: {
                    type: DataTypes.ENUM('PERCENTAGE', 'FIXED'),
                    defaultValue: 'PERCENTAGE',
                },
                value: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                businessId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                branchId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                status: {
                    type: DataTypes.ENUM('UNUSED', 'USED', 'EXPIRED'),
                    defaultValue: 'UNUSED',
                },
                validFrom: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
                validUntil: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                minOrderAmount: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE,
            },
            {
                sequelize,
                tableName: "vouchers",
                timestamps: true,
            }
        );

        return Voucher;
    }
}

export default (sequelize: Sequelize) => Voucher.initModel(sequelize);
