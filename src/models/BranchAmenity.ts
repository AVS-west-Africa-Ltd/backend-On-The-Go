import {
    Model,
    DataTypes,
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ModelStatic,
} from "sequelize";
import { Status, TStatus } from "./types/amenity.types";


export class BranchAmenity extends Model<
    InferAttributes<BranchAmenity>,
    InferCreationAttributes<BranchAmenity>> {
    declare id: CreationOptional<string>;
    declare businessId: number;
    declare branchId: number;
    declare amenityId: string;
    declare status: TStatus;
    declare rating: CreationOptional<number | null>;
    declare totalRating: CreationOptional<number>;
    declare ratingCount: CreationOptional<number>;
    declare meta: CreationOptional<Record<string, unknown> | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Profile) {
            BranchAmenity.belongsTo(models.Profile, {
                foreignKey: "businessId",
                as: "amenities",
            });
        }

        if (models.Branch) {
            BranchAmenity.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }

        if (models.Amenity) {
            BranchAmenity.belongsTo(models.Amenity, {
                foreignKey: "amenityId",
                as: "amenity",
                onDelete: "CASCADE",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<BranchAmenity> {
        BranchAmenity.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                businessId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                branchId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                amenityId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.ENUM(...Object.values(Status)),
                    allowNull: false,
                    defaultValue: Status.ACTIVE,
                },
                rating: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                },
                totalRating: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                ratingCount: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                meta: {
                    type: DataTypes.JSON,
                    allowNull: true,
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
                tableName: "branch_amenities",
                timestamps: true,
                indexes: [
                    { fields: ["businessId"] },
                    {
                        unique: true,
                        fields: ["businessId", "branchId", "amenityId"],
                    },
                ],
            }
        );

        return BranchAmenity;
    }
}

// Export default function that initializes the model
export default (sequelize: Sequelize) => BranchAmenity.initModel(sequelize);
