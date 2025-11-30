module.exports = (sequelize, DataTypes) => {
  const Amenity = sequelize.define(
    "Amenity",
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
        validate: {
          isValidMeta(value) {
            if (value && typeof value === "object") {
              const allowedKeys = ["name", "password"];
              const invalidKeys = Object.keys(value).filter(
                (key) => !allowedKeys.includes(key)
              );
              if (invalidKeys.length > 0) {
                throw new Error(
                  `Invalid meta keys: ${invalidKeys.join(", ")}. Allowed: ${allowedKeys.join(", ")}`
                );
              }
            }
          },
        },
        comment: "Allowed keys: name, password for Wi-Fi; may expand for future amenities",
      },

    },
    {
      tableName: "amenities",
      timestamps: true,
      indexes: [
        { fields: ["businessId"] },
        {
          unique: true,
          fields: ["businessId", "name"],
        },
      ],
    },
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
};