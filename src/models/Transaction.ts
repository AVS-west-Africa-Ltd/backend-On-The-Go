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

export class Transaction extends Model<
  InferAttributes<Transaction>,
  InferCreationAttributes<Transaction>
> {
  declare id: CreationOptional<number>;
  declare reference: string;
  declare userId: number;
  declare businessId: number;
  declare ticketId: number;
  declare amount: number;
  declare status: CreationOptional<"pending" | "completed">;
  declare hotspotTicket: CreationOptional<Record<string, any>>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Transaction.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Transaction> {
    Transaction.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        reference: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        businessId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("pending", "completed"),
          allowNull: false,
          defaultValue: "pending",
        },
        hotspotTicket: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
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
        tableName: "transactions",
        timestamps: true,
      }
    );

    return Transaction;
  }
}

export default (sequelize: Sequelize) => Transaction.initModel(sequelize);