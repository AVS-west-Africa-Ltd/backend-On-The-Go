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
import { TMemberRole, TMemberType } from "./types/member.types";
import { Chat } from "./Chat";
import { CommunityService } from "../services/community.service";
import { Community } from "./Community";
import { Profile } from "./Profile";

export class Member extends Model<
  InferAttributes<Member>,
  InferCreationAttributes<Member>
> {
  declare id: CreationOptional<number>;
  declare targetId: number;
  declare profileId: number;
  declare memberType: TMemberType;
  declare role: CreationOptional<TMemberRole>;
  declare isAccepted: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare community?: NonAttribute<Community>;
  declare profile?: NonAttribute<Profile>;
  declare chat?: NonAttribute<Chat>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Community) {
      Member.belongsTo(models.Community, {
        foreignKey: "targetId",
        as: "community",
        onDelete: "CASCADE",
        constraints: false,
      });
    }

    if (models.Chat) {
      Member.belongsTo(models.Chat, {
        foreignKey: "targetId",
        as: "chat",
        onDelete: "CASCADE",
        constraints: false
      });
    }

    if (models.Profile) {
      Member.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Member> {
    Member.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        targetId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        memberType: {
          type: DataTypes.ENUM("community", "chat"),
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM("member", "admin"),
          defaultValue: "member",
        },
        isAccepted: {
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
        tableName: "members",
        timestamps: true, // Assuming timestamps are on (default)
        indexes: [
          { unique: true, fields: ["targetId", "profileId", "memberType"] },
        ],
      }
    );

    return Member;
  }
}

export default (sequelize: Sequelize) => Member.initModel(sequelize);