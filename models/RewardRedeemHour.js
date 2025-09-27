
module.exports = (sequelize, DataTypes) => {
  const RewardRedeemHour = sequelize.define(
    "RewardRedeemHour",
    {
      businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Profiles",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      dayOfWeek: {
        type: DataTypes.ENUM(
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        ),
        allowNull: false,
      },

      openTime: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: "Business opening time (HH:mm:ss)",
      },

      closeTime: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: "Business closing time (HH:mm:ss)",
      },

      isClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Mark true if closed on this day",
      },
    },
    {
      tableName: "reward_redeem_hours",
      timestamps: true,
      indexes: [
        { fields: ["businessId"] },
        { unique: true, fields: ["businessId", "dayOfWeek"] }, // prevent duplicate days
      ],
    }
  );

  RewardRedeemHour.associate = (models) => {
    RewardRedeemHour.belongsTo(models.Profile, {
      foreignKey: "businessId",
      as: "businessProfile",
    });
  };

  return RewardRedeemHour;
};
