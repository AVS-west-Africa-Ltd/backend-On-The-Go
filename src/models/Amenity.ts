import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ModelStatic,
} from "sequelize";
import { AmenityAttributes, AmenityCategory, TAmenityCategory } from "./types/amenity.types";


export class Amenity extends Model<
  InferAttributes<Amenity>,
  InferCreationAttributes<Amenity>
> implements AmenityAttributes {
  declare id: CreationOptional<string>;
  declare name: TAmenityCategory;
  declare meta: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: Record<string, ModelStatic<Model>>) {
   
  }

static initModel(sequelize: Sequelize): ModelStatic<Amenity> {
    Amenity.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.ENUM(...Object.values(AmenityCategory)),
          allowNull: false,
          unique: true,
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
        tableName: "amenities",
        timestamps: true,
      }
    );

    return Amenity;
  }
}

// Export default function that initializes the model
export default (sequelize: Sequelize) => Amenity.initModel(sequelize);
