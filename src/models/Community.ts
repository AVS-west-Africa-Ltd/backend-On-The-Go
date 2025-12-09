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

export class Community extends Model<
  InferAttributes<Community>,
  InferCreationAttributes<Community>
> {
  declare id: CreationOptional<string>;
  declare userId: number;
  declare profileId: number;
  declare name: string;
  declare photo: string;
  declare description: CreationOptional<string>;
  declare type: CreationOptional<"public" | "private">;
  declare visibility: CreationOptional<"public" | "invite_only">;
  declare inviteCode: string;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<any>;
  declare profile?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Community.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
    if (models.Profile) {
      Community.belongsTo(models.Profile, { foreignKey: "profileId", as: "profile" });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Community> {
    Community.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "profiles", key: "id" },
          onDelete: "CASCADE",
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: {
            notEmpty: { msg: "Community name is required" },
          },
        },
        photo: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: "",
        },
        type: {
          type: DataTypes.ENUM("public", "private"),
          allowNull: false,
          defaultValue: "public",
        },
        visibility: {
          type: DataTypes.ENUM("public", "invite_only"),
          allowNull: false,
          defaultValue: "public",
        },
        inviteCode: {
          type: DataTypes.STRING,
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
        tableName: "communities",
        timestamps: true,
        indexes: [
          { fields: ["userId"] },
          { fields: ["profileId"] },
          { fields: ["type"] },
          { fields: ["visibility"] },
          { unique: true, fields: ["name"] },
          { unique: true, fields: ["inviteCode"] },
        ],
      }
    );

    return Community;
  }
}

export default (sequelize: Sequelize) => Community.initModel(sequelize);