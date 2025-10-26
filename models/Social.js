module.exports = (sequelize, DataTypes) => {
  const Social = sequelize.define(
    "Social",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      platform: {
        type: DataTypes.ENUM(
          "facebook",
          "instagram",
          "twitter",
          "linkedin",
          "tiktok",
          "youtube",
          "telegram",
          "threads",
          "other"
        ),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isUrl: true },
      },
      meta: {
        
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "socials",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["platform"] },
        {
          unique: true,
          fields: ["profileId", "platform"], // prevents duplicates
        },
      ],
    }
  );

  Social.associate = (models) => {
    // Each social link belongs to one user
    Social.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });

    // Optional: link to Profile if you want to associate social links with profiles instead of users
    Social.belongsTo(models.Profile, {
      foreignKey: "profileId",
      as: "profile",
      onDelete: "CASCADE",
    });
  };

  return Social;
};
