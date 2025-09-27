
module.exports = (sequelize, DataTypes) => {
  const Reward = sequelize.define("Reward", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    type: {
      type: DataTypes.ENUM("referral", "purchase", "bonus"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    redeemed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  Reward.associate = (models) => {
    Reward.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Reward;
};
