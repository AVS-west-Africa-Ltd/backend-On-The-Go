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
    declare type: TInsightType;
    declare value: CreationOptional<number>;

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
                type: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                value: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
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
                    { fields: ["type"] },
                    { unique: true, fields: ["profileId", "type"] },
                ],
            }
        );

        return Insight;
    }
}

export default (sequelize: Sequelize) => Insight.initModel(sequelize);
