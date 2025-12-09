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

export class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare profileId: number;
  declare postId: number;
  declare parentId: CreationOptional<number | null>;
  declare body: string;
  declare likes: CreationOptional<number>;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<any>;
  declare post?: NonAttribute<any>;
  declare replies?: NonAttribute<Comment[]>;
  declare parent?: NonAttribute<Comment>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Comment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
    if (models.Post) {
      Comment.belongsTo(models.Post, { foreignKey: "postId", as: "post" });
    }
    if (models.Comment) {
      Comment.hasMany(models.Comment, {
        foreignKey: "parentId",
        as: "replies",
        onDelete: "CASCADE",
      });
      Comment.belongsTo(models.Comment, {
        foreignKey: "parentId",
        as: "parent",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Comment> {
    Comment.init(
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
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        postId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        parentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        likes: {
          type: DataTypes.INTEGER,
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
        tableName: "comments",
        timestamps: true,
      }
    );

    return Comment;
  }
}

export default (sequelize: Sequelize) => Comment.initModel(sequelize);