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

export class NetworkRouter extends Model<
  InferAttributes<NetworkRouter>,
  InferCreationAttributes<NetworkRouter>
> {
  declare id: CreationOptional<number>;
  declare host: string;
  declare username: string;
  declare password: string;
  declare port: CreationOptional<number>;
  declare ssl: CreationOptional<boolean>;
  declare metadata: CreationOptional<Record<string, any>>;
  declare userId: number;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      NetworkRouter.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<NetworkRouter> {
    NetworkRouter.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        host: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        port: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 8728,
        },
        ssl: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        metadata: {
          type: DataTypes.JSON,
          defaultValue: {
            status: "new",
            items: [],
          },
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: "users",
            key: "id",
          },
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
        tableName: "networkRouters",
        timestamps: true,
      }
    );

    return NetworkRouter;
  }
}

export default (sequelize: Sequelize) => NetworkRouter.initModel(sequelize);