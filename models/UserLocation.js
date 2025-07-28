
module.exports = (sequelize, DataTypes) => {
  const UserLocation = sequelize.define(
    "UserLocation",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: "user_locations",
      timestamps: true,
    }
  );

  return UserLocation;
};