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
import { Post } from "./post.model";

export class Bookmark extends Model<
    InferAttributes<Bookmark>,
    InferCreationAttributes<Bookmark>
> {
    declare id: CreationOptional<number>;
    declare profileId: number;
    declare postId: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    // Associations
    declare profile?: NonAttribute<Profile>;
    declare post?: NonAttribute<Post>;

    static associate(models: Record<string, ModelStatic<Model>>) {
        if (models.Profile) {
            Bookmark.belongsTo(models.Profile, {
                foreignKey: "profileId",
                as: "profile",
            });
        }
        if (models.Post) {
            Bookmark.belongsTo(models.Post, {
                foreignKey: "postId",
                as: "post",
            });
        }
    }

    static initModel(sequelize: Sequelize): ModelStatic<Bookmark> {
        Bookmark.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                profileId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                postId: {
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
                tableName: "bookmarks",
                timestamps: true,
            }
        );

        return Bookmark;
    }
}

export default (sequelize: Sequelize) => Bookmark.initModel(sequelize);
