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

export class TicketProfile extends Model<
  InferAttributes<TicketProfile>,
  InferCreationAttributes<TicketProfile>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare price: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare userId: number;
  declare routerId: number;
  declare owner: CreationOptional<string>;
  declare title: CreationOptional<string>;
  declare description: CreationOptional<string>;
  declare bandwidth: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare networkRouter?: NonAttribute<any>;
  declare user?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.NetworkRouter) {
      TicketProfile.belongsTo(models.NetworkRouter, {
        foreignKey: "routerId",
        onDelete: "CASCADE",
      });
    }

    if (models.User) {
      TicketProfile.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }

    if (models.NetworkRouter) {
      TicketProfile.belongsTo(models.NetworkRouter, {
        foreignKey: "routerId",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<TicketProfile> {
    TicketProfile.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        price: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        routerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "networkRouters",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        owner: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "",
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "",
        },
        description: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "",
        },
        bandwidth: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "",
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
        tableName: "ticketProfiles",
        timestamps: true,
      }
    );

    return TicketProfile;
  }
}

export default (sequelize: Sequelize) => TicketProfile.initModel(sequelize);