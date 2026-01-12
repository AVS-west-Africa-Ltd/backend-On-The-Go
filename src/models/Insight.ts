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
import { Profile } from "./Profile";
import { TInsightType } from "./types/insight.types";

export class Insight extends Model<
    InferAttributes<Insight>,
    InferCreationAttributes<Insight>
> {
    declare id: CreationOptional<number>;
    declare profileId: number;
    declare branchId: CreationOptional<number | null>;
    declare type: TInsightType;
    declare value: CreationOptional<number>;
    declare period: CreationOptional<string | null>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    // Associations
    declare profile?: NonAttribute<Profile>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Profile) {
            Insight.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
                onDelete: "CASCADE",
            });
        }
        if (models.Branch) {
            Insight.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<Insight> {
        Insight.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                profileId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: "profiles", key: "id" },
                },
                branchId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: "branches", key: "id" },
                },
                type: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                value: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                period: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                    defaultValue: "TOTAL"
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
                tableName: "insights",
                timestamps: true,
                indexes: [
                    { fields: ["profileId"] },
                    { fields: ["branchId"] },
                    { fields: ["type"] },
                    { unique: true, fields: ["profileId", "branchId", "type", "period"] },
                ],
            }
        );

        return Insight;
    }
}

export default (sequelize: Sequelize) => Insight.initModel(sequelize);
