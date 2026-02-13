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

export class Friend extends Model<
  InferAttributes<Friend>,
  InferCreationAttributes<Friend>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare ownerId: number;
  declare friendId: number;
  declare status: CreationOptional<"pending" | "accepted" | "blocked">;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare following?: NonAttribute<Profile>;
  declare follower?: NonAttribute<Profile>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      Friend.belongsTo(models.Profile, {
        foreignKey: "ownerId",
        as: "following",
      });
      Friend.belongsTo(models.Profile, {
        foreignKey: "friendId",
        as: "follower",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Friend> {
    Friend.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          onDelete: "CASCADE",
        },
        ownerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          onDelete: "CASCADE",
        },
        friendId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          onDelete: "CASCADE",
        },
        status: {
          type: DataTypes.ENUM("pending", "accepted", "blocked"),
          allowNull: false,
          defaultValue: "accepted",
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
        tableName: "friends",
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ["ownerId", "friendId"],
          },
        ],
      }
    );

    return Friend;
  }
}

export default (sequelize: Sequelize) => Friend.initModel(sequelize);