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

export class MikrotikRouter extends Model<
  InferAttributes<MikrotikRouter>,
  InferCreationAttributes<MikrotikRouter>
> {
  declare id: CreationOptional<number>;
  declare host: string;
  declare username: string;
  declare password: string;
  declare port: CreationOptional<number>;
  declare ssl: CreationOptional<boolean>;
  declare metadata: CreationOptional<Record<string, any>>;
  declare profileId: number;
  declare branchId: number;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare profile?: NonAttribute<any>;
  declare branch?: NonAttribute<any>;
  declare ticketProfiles?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      MikrotikRouter.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
    if (models.Branch) {
      MikrotikRouter.belongsTo(models.Branch, {
        foreignKey: "branchId",
        as: "branch",
        onDelete: "CASCADE",
      });
    }

    if (models.TicketProfile) {
      MikrotikRouter.hasMany(models.TicketProfile, {
        foreignKey: "routerId",
        as: "ticketProfiles",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<MikrotikRouter> {
    MikrotikRouter.init(
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
        profileId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "profiles",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        branchId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "branches",
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
        tableName: "mikrotikRouters",
        timestamps: true,
      }
    );

    return MikrotikRouter;
  }
}

export default (sequelize: Sequelize) => MikrotikRouter.initModel(sequelize);