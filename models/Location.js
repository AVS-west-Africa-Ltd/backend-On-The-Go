module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
    {
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
    },
    {
      tableName: "locations",
      timestamps: true,
    }
  );

  return Location;
};
