module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define(
    "Referral",
    {
      referrerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      refereeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "rewarded"),
        defaultValue: "pending",
      },
    },
    {
      tableName: "referrals",
      timestamps: true,
    }
  );

  return Referral;
};
