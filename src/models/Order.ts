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
import { Profile } from "./Profile";
import { Branch } from "./Branch";
import { OrderItem } from "./OrderItem";
import { OrderPaymentStatus, OrderStatus, TOrderPaymentStatus, TOrderStatus } from "./types/order.types";

export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare customerId: number;
  declare businessId: number;
  declare branchId: number;
  declare subTotal: number;
  declare discountAmount: number;
  declare totalAmount: number;
  declare voucherId: CreationOptional<number | null>;
  declare voucherCode: CreationOptional<string | null>;
  declare status: TOrderStatus;
  declare paymentStatus: TOrderPaymentStatus;
  declare amenitiesCategory: CreationOptional<string[]>;
  declare autoRenew: CreationOptional<boolean>;
  declare meta: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare customer?: NonAttribute<Profile>
  declare business?: NonAttribute<Profile>
  declare branch?: NonAttribute<Branch>
  declare items?: NonAttribute<OrderItem[]>

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      Order.belongsTo(models.Profile, {
        foreignKey: "customerId",
        as: "customer",
        onDelete: "CASCADE",
      });
    }

    if (models.Branch) {
      Order.belongsTo(models.Branch, {
        foreignKey: "branchId",
        as: "branch",
        onDelete: "CASCADE",
      });
    }

    if (models.Profile) {
      Order.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "business",
        onDelete: "CASCADE",
      });
    }
    if (models.OrderItem) {
      Order.hasMany(models.OrderItem, {
        foreignKey: "orderId",
        as: "items",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize) {
    Order.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
        customerId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        businessId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        branchId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        subTotal: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        discountAmount: {
          type: DataTypes.FLOAT,
          defaultValue: 0
        },
        totalAmount: {
          type: DataTypes.FLOAT,
          allowNull: false
        }, // subTotal - discountAmount
        voucherId: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        voucherCode: {
          type: DataTypes.STRING,
          allowNull: true
        },
        amenitiesCategory: {
          type: DataTypes.JSON,
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM(...Object.values(OrderStatus)),
          defaultValue: "new",
        },
        paymentStatus: {
          type: DataTypes.ENUM(...Object.values(OrderPaymentStatus)),
          defaultValue: "pending",
        },
        autoRenew: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        meta: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        tableName: "orders",
        timestamps: true,
        indexes: [{ fields: ["businessId"] }, { fields: ["branchId"] }],
      }
    );
    return Order;
  }
}

export default (sequelize: Sequelize) => Order.initModel(sequelize);
