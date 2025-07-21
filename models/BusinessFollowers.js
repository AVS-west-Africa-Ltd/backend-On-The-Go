module.exports = (sequelize, DataTypes) => {
  const BusinessFollowers = sequelize.define("BusinessFollowers", {
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

  return  BusinessFollowers;  
}
