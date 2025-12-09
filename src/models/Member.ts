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

export class Member extends Model<
  InferAttributes<Member>,
  InferCreationAttributes<Member>
> {
  declare id: CreationOptional<number>;
  declare targetId: string;
  declare profileId: number;
  declare memberType: TMemberType;
  declare role: CreationOptional<TMemberRole>;
  declare isAccepted: CreationOptional<boolean>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare community?: NonAttribute<any>;
  declare profile?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Community) {
      Member.belongsTo(models.Community, {
        foreignKey: "targetId",
        as: "community",
        constraints: false,
      });
    }

    if (models.Chat){
    Member.belongsTo(models.Chat, {
  foreignKey: "targetId",
  as: "chat",
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
          type: DataTypes.UUID,
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