import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, ModelStatic, DataTypes } from "sequelize";

export enum ReferralStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
}

export class Referral extends Model<
    InferAttributes<Referral>,
    InferCreationAttributes<Referral>
> {
    declare id: CreationOptional<number>;
    declare referrerId: number;
    declare referredId: number;

    declare status: CreationOptional<ReferralStatus>;
    declare rewardIssued: CreationOptional<boolean>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static initModel(sequelize: Sequelize): ModelStatic<Referral> {
        Referral.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                referrerId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                referredId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.ENUM(...Object.values(ReferralStatus)),
                    defaultValue: ReferralStatus.PENDING,
                },
                rewardIssued: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE,
            },
            {
                sequelize,
                tableName: "referrals",
                timestamps: true,
            }
        );

        return Referral;
    }
}

export default (sequelize: Sequelize) => Referral.initModel(sequelize);
