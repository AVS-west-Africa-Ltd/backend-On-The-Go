module.exports = (sequelize, DataTypes) => {
  const BusinessFollower = sequelize.define("BusinessFollower", {
    followerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    followedId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    followedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return  BusinessFollower;  
}
