import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
} from "sequelize";

export class Location extends Model<
  InferAttributes<Location>,
  InferCreationAttributes<Location>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare lat: number;
  declare lon: number;
  declare icon: CreationOptional<string | null>;
  declare types: CreationOptional<string | null>;
  declare vicinity: CreationOptional<string | null>;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: Record<string, ModelStatic<Model>>) {
  }

  static initModel(sequelize: Sequelize): ModelStatic<Location> {
    Location.init(
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
        lat: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        lon: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        types: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        vicinity: {
          type: DataTypes.TEXT,
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
        tableName: "locations",
        timestamps: true,
      }
    );

    return Location;
  }
}

export default (sequelize: Sequelize) => Location.initModel(sequelize);