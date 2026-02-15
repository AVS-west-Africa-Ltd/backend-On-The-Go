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
  declare profileId: number;
  declare branchId: number;
  declare routerId: number;
  declare owner: CreationOptional<string>;
  declare title: CreationOptional<string>;
  declare description: CreationOptional<string>;
  declare bandwidth: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare networkRouter?: NonAttribute<any>;
  declare profile?: NonAttribute<any>;
  declare branch?: NonAttribute<any>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.MikrotikRouter) {
      TicketProfile.belongsTo(models.MikrotikRouter, {
        foreignKey: "routerId",
        onDelete: "CASCADE",
      });
    }

    if (models.Profile) {
      TicketProfile.belongsTo(models.Profile, {
        foreignKey: "profileId",
        onDelete: "CASCADE",
      });
    }

    if (models.Branch) {
      TicketProfile.belongsTo(models.Branch, {
        foreignKey: "branchId",
        onDelete: "CASCADE",
      });
    }

    if (models.MikrotikRouter) {
      TicketProfile.belongsTo(models.MikrotikRouter, {
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
          allowNull: false,
          references: {
            model: "branches",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        routerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "mikrotikRouters",
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
