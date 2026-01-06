import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
  NonAttribute,
} from "sequelize";
import { Order } from "./Order";
import { Profile } from "./Profile";
import { Branch } from "./Branch";
import { PaymentMethod, PaymentProvider, TPaymentMethod, TPaymentProvider, TransactionStatus, TTransactionStatus } from "./types/transaction.types";

export class Transaction extends Model<
  InferAttributes<Transaction>,
  InferCreationAttributes<Transaction>
> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare customerId: number;
  declare businessId: number;
  declare branchId: number;

  declare amount: number;
  declare currency: string;
  declare paymentMethod: CreationOptional<TPaymentMethod>;
  declare provider: TPaymentProvider;

  declare reference: string;
  declare status: TTransactionStatus;
  declare provider_reference: string;

  declare meta: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare order?: NonAttribute<Order>;
  declare customer?: NonAttribute<Profile>;
  declare business?: NonAttribute<Profile>;
  declare branch?: NonAttribute<Branch>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Order) {
      Transaction.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });
    }

    if (models.Profile) {
      Transaction.belongsTo(models.Profile, {
        foreignKey: "customerId",
        as: "customer",
      });
    }

    if (models.Profile) {
      Transaction.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "business",
      });
    }

    if (models.Branch) {
      Transaction.belongsTo(models.Branch, {
        foreignKey: "branchId",
        as: "branch",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Transaction> {
    Transaction.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        customerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        businessId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        branchId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        amount: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "NGN",
        },
        paymentMethod: {
          type: DataTypes.ENUM(...Object.values(PaymentMethod)),
          allowNull: true,
        },
        reference: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(TransactionStatus)),
          allowNull: false,
          defaultValue: "pending",
        },
        provider_reference: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        provider: {
          type: DataTypes.ENUM(...Object.values(PaymentProvider)),
          allowNull: false,
        },
        meta: {
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
        tableName: "transactions",
        timestamps: true,
      }
    );

    return Transaction;
  }
}

export default (sequelize: Sequelize) => Transaction.initModel(sequelize);
