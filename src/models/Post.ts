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
import { TPostTargetType, TPostType } from "./types/post.types";
import { User } from "./User";
import { Profile } from "./Profile";
import { Branch } from "./Branch";
import { Comment } from "./Comment";

export class Post extends Model<
  InferAttributes<Post>,
  InferCreationAttributes<Post>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare profileId: number;
  declare branchId: CreationOptional<number | null>;
  declare body: string;
  declare postType: CreationOptional<TPostType>;
  declare targetId: number;
  declare targetType: CreationOptional<TPostTargetType>;
  declare likes: CreationOptional<number>;
  declare comments: CreationOptional<number>;
  declare media: CreationOptional<Record<string, any> | null>;
  declare rating: CreationOptional<Record<string, any> | null>;
  declare bookmarks: CreationOptional<Record<string, any> | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare author?: NonAttribute<User>;
  declare business?: NonAttribute<Profile>;
  declare branch?: NonAttribute<Branch>;
  declare comment?: NonAttribute<Comment[]>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Post.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
    if (models.Profile) {
      Post.belongsTo(models.Profile, { foreignKey: "profileId", as: "author" });
      Post.belongsTo(models.Profile, { foreignKey: "target", as: "business" });
    }
    if (models.Branch) {
      Post.belongsTo(models.Branch, { foreignKey: "branchId", as: "branch" });
    }
    if (models.Comment) {
      Post.hasMany(models.Comment, {
        foreignKey: "postId",
        as: "comment",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Post> {
    Post.init(
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
        branchId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        postType: {
          type: DataTypes.ENUM("review", "normal"),
          allowNull: false,
          defaultValue: "normal",
        },
        targetId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        targetType: {
          type: DataTypes.ENUM("community", "business"),
          allowNull: false,
          defaultValue: "community",
        },
        likes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        comments: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        media: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        rating: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        bookmarks: {
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
        tableName: "posts",
        timestamps: true,
      }
    );

    return Post;
  }
}

export default (sequelize: Sequelize) => Post.initModel(sequelize);