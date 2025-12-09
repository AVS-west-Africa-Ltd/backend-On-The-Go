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

export class Social extends Model<InferAttributes<Social>, InferCreationAttributes<Social>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare profileId: number;
  declare platform:
    | "facebook"
    | "instagram"
    | "twitter"
    | "linkedin"
    | "tiktok"
    | "youtube"
    | "telegram"
    | "threads"
    | "other";
  declare url: string;
  declare meta: CreationOptional<Record<string, any>>;
  declare isVerified: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<any>;
  declare profile?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Social.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
      });
    }

    if (models.Profile) {
      Social.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Social> {
    Social.init(
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
        platform: {
          type: DataTypes.ENUM(
            "facebook",
            "instagram",
            "twitter",
            "linkedin",
            "tiktok",
            "youtube",
            "telegram",
            "threads",
            "other"
          ),
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { isUrl: true },
        },
        meta: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
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
        tableName: "socials",
        timestamps: true,
        indexes: [
          { fields: ["userId"] },
          { fields: ["platform"] },
          {
            unique: true,
            fields: ["profileId", "platform"],
          },
        ],
      }
    );

    return Social;
  }
}

export default (sequelize: Sequelize) => Social.initModel(sequelize);