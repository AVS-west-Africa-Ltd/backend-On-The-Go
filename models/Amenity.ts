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
import { AmenityAttributes, AmenityName } from "./types/amenity.types";


export class Amenity extends Model<
  InferAttributes<Amenity>,
  InferCreationAttributes<Amenity>
> implements AmenityAttributes {
  // declare id: CreationOptional<number>;
  declare userId: number;
  declare businessId: number;
  declare branchId: number;
  declare name: AmenityName;
  declare rating: CreationOptional<number | null>;
  declare meta: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.Profile) {
      Amenity.belongsTo(models.Profile, {
        foreignKey: "businessId",
        as: "amenities",
      });
    }
  }


  static initModel(sequelize: Sequelize): ModelStatic<Amenity> {
    Amenity.init(
      {
       // id: {
      //   type: DataTypes.UUID,
      //   defaultValue: DataTypes.UUIDV4,
      //   primaryKey: true,
      // },

        userId: {
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

        name: {
        type: DataTypes.ENUM("wifi", "coffee", "parking", "air_conditioning"),
        allowNull: false,
      },

        rating: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },

        meta: {
          type: DataTypes.JSON,
          allowNull: true,
          comment:
            "Allowed keys: name, password for Wi-Fi; may expand for future amenities",
          validate: {
            isValidMeta(value: unknown) {
              if (!value) return;
              if (typeof value !== "object" || Array.isArray(value)) {
                throw new Error("meta must be an object");
              }
              const allowedKeys = ["name", "password"];
              const invalidKeys = Object.keys(value as object).filter(
                (k) => !allowedKeys.includes(k)
              );
              if (invalidKeys.length > 0) {
                throw new Error(
                  `Invalid meta keys: ${invalidKeys.join(
                    ", "
                  )}. Allowed: ${allowedKeys.join(", ")}`
                );
              }
            },
          },
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
        indexes: [
          { fields: ["businessId"] },
          {
            unique: true,
            fields: ["businessId", "name"],
          },
        ],
      }
    );

     Amenity.associate = (models) => {

    Amenity.belongsTo(models.Profile, { foreignKey: "businessId", as: "amenities" });

     Amenity.belongsTo(models.Branch, {
      foreignKey: "branchId",
      as: "branch",
      onDelete: "CASCADE",
    });

  };

    return Amenity;
  }
}

export default Amenity;
