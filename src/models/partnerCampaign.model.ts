import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, ModelStatic, DataTypes } from "sequelize";
import { VoucherType } from "./types/rewardRules.types";

export class PartnerCampaign extends Model<
    InferAttributes<PartnerCampaign>,
    InferCreationAttributes<PartnerCampaign>
> {
    declare id: CreationOptional<number>;
    declare partnerName: string;
    declare businessId: CreationOptional<number | null>;

    declare voucherType: VoucherType;
    declare value: number;

    declare qrToken: string;
    declare expiresAt: Date;
    declare maxRedemptions: number;
    declare isActive: CreationOptional<boolean>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static initModel(sequelize: Sequelize): ModelStatic<PartnerCampaign> {
        PartnerCampaign.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                partnerName: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                businessId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                voucherType: {
                    type: DataTypes.ENUM(...Object.values(VoucherType)),
                    allowNull: false,
                },
                value: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                },
                qrToken: {
                    type: DataTypes.STRING,
                    unique: true,
                    allowNull: false,
                },
                expiresAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                maxRedemptions: {
                    type: DataTypes.INTEGER,
                    defaultValue: 1000,
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
                tableName: "partner_campaigns",
                timestamps: true,
            }
        );

        return PartnerCampaign;
    }
}

export default (sequelize: Sequelize) => PartnerCampaign.initModel(sequelize);
