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

export class ProfileVisit extends Model<
    InferAttributes<ProfileVisit>,
    InferCreationAttributes<ProfileVisit>
> {
    declare id: CreationOptional<number>;
    declare userId: number | null; // Nullable for guest visits
    declare profileId: number;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    // Associations
    declare profile?: NonAttribute<Profile>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Profile) {
            ProfileVisit.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
                onDelete: "CASCADE",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<ProfileVisit> {
        ProfileVisit.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                profileId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
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
                tableName: "profile_visits",
                timestamps: true,
                indexes: [{ fields: ["profileId"] }, { fields: ["userId"] }],
            }
        );

        return ProfileVisit;
    }
}

export default (sequelize: Sequelize) => ProfileVisit.initModel(sequelize);
