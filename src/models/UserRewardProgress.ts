import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, ModelStatic, DataTypes } from "sequelize";

export class UserRewardProgress extends Model<
    InferAttributes<UserRewardProgress>,
    InferCreationAttributes<UserRewardProgress>
> {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare businessId: number;
    declare ruleId: number;

    declare progress: number;
    declare threshold: number;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static initModel(sequelize: Sequelize): ModelStatic<UserRewardProgress> {
        UserRewardProgress.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                businessId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                ruleId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                progress: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                },
                threshold: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE,
            },
            {
                sequelize,
                tableName: "user_reward_progress",
                timestamps: true,
                indexes: [
                    {
                        fields: ["userId", "businessId", "ruleId"],
                        unique: true
                    }
                ]
            }
        );

        return UserRewardProgress;
    }
}

export default (sequelize: Sequelize) => UserRewardProgress.initModel(sequelize);
