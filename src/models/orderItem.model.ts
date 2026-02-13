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
import { Product } from "./product.model";
import { Order } from "./order.model";

export class OrderItem extends Model<
    InferAttributes<OrderItem>,
    InferCreationAttributes<OrderItem>
> {
    declare id: CreationOptional<string>;
    declare orderId: string;
    declare productId: number;
    declare quantity: number;
    declare amount: number;
    declare totalAmount: number;
    declare meta: CreationOptional<Record<string, unknown> | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare order?: NonAttribute<Order>;
    declare product?: NonAttribute<Product>;

    static associate(models: Record<string, ModelStatic<Model>>) {

        if (models.Order) {
            OrderItem.belongsTo(models.Order, {
                foreignKey: "orderId",
                as: "order",
                onDelete: "CASCADE",
            });
        }
        if (models.Product) {
            OrderItem.belongsTo(models.Product, {
                foreignKey: "productId",
                as: "product",
                onDelete: "CASCADE",
            });
        }
    }

    static initModel(sequelize: Sequelize) {
        OrderItem.init(
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
                productId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                quantity: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 1
                },
                amount: {
                    type: DataTypes.FLOAT,
                    allowNull: false
                },
                totalAmount: {
                    type: DataTypes.FLOAT,
                    allowNull: false
                },
                meta: {
                    type: DataTypes.JSON,
                    allowNull: true
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE,
            },
            {
                sequelize,
                tableName: "order_items",
                timestamps: true
            }
        );

        return OrderItem;
    }
}


export default (sequelize: Sequelize) => OrderItem.initModel(sequelize);
