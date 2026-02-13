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
import { Member } from "./member.model";
import { Message } from "./message.model";
import { Profile } from "./profile.model";
import { User } from "./user.model";

export class Chat extends Model<
  InferAttributes<Chat>,
  InferCreationAttributes<Chat>
> {
  // UUIDs are often strings in TS, but handled as UUID in DB
  declare id: CreationOptional<string>;
  declare name: CreationOptional<string | null>;
  declare type: CreationOptional<"private" | "group">;
  declare lastMessageAt: CreationOptional<Date | null>;
  declare userId: number;
  declare profileId: number;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare messages?: NonAttribute<Message[]>; // Replace 'any' with Message model type when available
  declare members?: NonAttribute<Member[]>;  // Replace 'any' with Member model type when available
  declare creator?: NonAttribute<Profile>;    // Replace 'any' with Profile model type
  declare user?: NonAttribute<User>;       // Replace 'any' with User model type

  static associate(models: Record<string, ModelStatic<Model>>) {
    // 1. Messages Association
    if (models.Message) {
      Chat.hasMany(models.Message, {
        foreignKey: "chatId",
        as: "messages",
        onDelete: "CASCADE",
      });
    }

    // 2. Members Association
    if (models.Member) {
      Chat.hasMany(models.Member, {
        foreignKey: "targetId",
        constraints: false, // Kept from your JS code
        as: "members",
        // Note: You might need 'as: "members"' here if your logic relies on it
      });
    }

    // 3. Profile (Creator) Association
    if (models.Profile) {
      Chat.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "creator",
      });
    }

    // 4. User Association
    if (models.User) {
      Chat.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Chat> {
    Chat.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM("private", "group"),
          defaultValue: "private",
          allowNull: false,
        },
        lastMessageAt: {
          type: DataTypes.DATE,
          allowNull: true,
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
        tableName: "chats",
        timestamps: true,
      }
    );

    return Chat;
  }
}

// Export the initializer
export default (sequelize: Sequelize) => Chat.initModel(sequelize);