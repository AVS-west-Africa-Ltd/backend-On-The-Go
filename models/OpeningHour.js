// models/openingHours.js
module.exports = (sequelize, DataTypes) => {
  const OpeningHour = sequelize.define(
    "OpeningHour",
    {
      businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "profiles",
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
      tableName: "opening_hours",
      timestamps: true,
      indexes: [
        { fields: ["businessId"] },
        { unique: true, fields: ["businessId", "dayOfWeek"] }, // prevent duplicate days
      ],
    }
  );

  OpeningHour.associate = (models) => {
    OpeningHour.belongsTo(models.Profile, {
      foreignKey: "businessId",
      as: "businessProfile",
    });
  };

  return OpeningHour;
};
