import {
    Model,
    DataTypes,
    Sequelize,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    ModelStatic,
} from "sequelize";
import { ActivityLogAttributes } from "./types/activityLog.types";

export class ActivityLog extends Model<
    InferAttributes<ActivityLog>,
    InferCreationAttributes<ActivityLog>
> implements ActivityLogAttributes {
    declare id: CreationOptional<string>;
    declare branchId: number;
    declare userId: number;
    declare action: string;
    declare details: CreationOptional<Record<string, any> | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Branch) {
            ActivityLog.belongsTo(models.Branch, {
                foreignKey: "branchId",
                as: "branch",
                onDelete: "CASCADE",
            });
        }
        if (models.User) {
            ActivityLog.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
                onDelete: "CASCADE",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<ActivityLog> {
        ActivityLog.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                branchId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                action: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                details: {
                    type: DataTypes.JSON,
                    allowNull: true,
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE,
            },
            {
                sequelize,
                tableName: "activity_logs",
                timestamps: true,
                indexes: [{ fields: ["branchId"] }, { fields: ["userId"] }],
            }
        );
        return ActivityLog;
    }
}

export default (sequelize: Sequelize) => ActivityLog.initModel(sequelize);
