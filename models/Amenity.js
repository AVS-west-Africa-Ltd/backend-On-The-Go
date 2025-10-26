module.exports = (sequelize, DataTypes) => {
  const Amenity = sequelize.define(
    "Amenity",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      name: {
        type: DataTypes.ENUM("wifi", "coffee"),
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

  };

  return Amenity;
};