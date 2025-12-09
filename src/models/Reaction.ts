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

export class Reaction extends Model<
  InferAttributes<Reaction>,
  InferCreationAttributes<Reaction>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare profileId: number;
  declare targetId: number;
  declare targetType: "post" | "comment";
  declare type: "like" | "dislike" | "love";

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<any>;
  declare post?: NonAttribute<any>;
  declare comment?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Reaction.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }

    // Polymorphic relationships
    if (models.Post) {
      Reaction.belongsTo(models.Post, {
        foreignKey: "targetId",
        constraints: false,
        as: "post",
      });
    }

    if (models.Comment) {
      Reaction.belongsTo(models.Comment, {
        foreignKey: "targetId",
        constraints: false,
        as: "comment",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Reaction> {
    Reaction.init(
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
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          onDelete: "CASCADE",
        },
        targetId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        targetType: {
          type: DataTypes.ENUM("post", "comment"),
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM("like", "dislike", "love"),
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
        tableName: "reactions",
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ["userId", "targetId", "targetType"],
          },
        ],
        scopes: {
          forPost: { where: { targetType: "post" } },
          forComment: { where: { targetType: "comment" } },
        },
      }
    );

    return Reaction;
  }
}

export default (sequelize: Sequelize) => Reaction.initModel(sequelize);