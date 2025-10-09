module.exports = (sequelize, DataTypes) => {
  const Amenity = sequelize.define(
    "Amenity",
    {
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
                isValidLinks(value) {
                    if (value) {
                        const allowedKeys = ["name", "password"];
                        const keys = Object.keys(value);
                        const invalidKeys = keys.filter((k) => !allowedKeys.includes(k));
                        if (invalidKeys.length > 0) {
                            throw new Error(`Invalid wifi keys: ${invalidKeys.join( ", " )}. Allowed keys are: ${allowedKeys.join(", ")}`);
                        }
                    }
                },
            },
            comment: "Allowed keys: name, password",
      },
    },
    {
      tableName: "amenities",
      timestamps: true,
    }
  );

  Amenity.associate = (models) => {

    Amenity.belongsTo(models.Profile, { foreignKey: "businessId", as: "amenities" });

  };

  return Amenity;
};