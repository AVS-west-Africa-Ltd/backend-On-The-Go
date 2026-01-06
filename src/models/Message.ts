import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
} from "sequelize";

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<string>;
  declare chatId: string;
  declare senderId: number;
  declare content: string;
  declare media: CreationOptional<string[]>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Message.belongsTo(models.User, {
        foreignKey: "senderId",
        as: "sender",
      });
    }
    if (models.Chat) {
      Message.belongsTo(models.Chat, {
        foreignKey: "chatId",
        as: "chat",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Message> {
    Message.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        chatId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        senderId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        media: {
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
        tableName: "messages",
        timestamps: true,
      }
    );

    return Message;
  }
}

export default (sequelize: Sequelize) => Message.initModel(sequelize);