
module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define(
    "Profile",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      profileType: {
        type: DataTypes.ENUM("personal", "business"),
        allowNull: false,
        defaultValue: "personal",
      },
      businessType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ""
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      picture: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      interests: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      amenities: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      profession: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isStudent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      university: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      geoLocation: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      socialLinks: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidLinks(value) {
                    if (value) {
                        const allowedKeys = ["instagram", "twitter", "website"];
                        const keys = Object.keys(value);

                        // 🚫 Check if any disallowed keys exist
                        const invalidKeys = keys.filter((k) => !allowedKeys.includes(k));
                        if (invalidKeys.length > 0) {
                            throw new Error(`Invalid social keys: ${invalidKeys.join( ", " )}. Allowed keys are: ${allowedKeys.join(", ")}`);
                        }
                    }
                },
            },
            comment: "Allowed keys: twitter, instagram, website",
      },
      wifiDetails: {
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
      followers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      following: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      placesVisited: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
    },
    {
      tableName: "profiles",
      indexes: [{ fields: ["userId"] }, { fields: ["profileType"] }],
      hooks: {
        beforeSave: async (profile) => {
          if (profile.planExpirationDate) {
            profile.planStatus =
              new Date(profile.planExpirationDate) > new Date()
                ? "active"
                : "expired";
          } else {
            profile.planStatus = "none";
          }
        },
      },
    }
  );

  Profile.associate = (models) => {
    Profile.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });

    Profile.hasMany(models.Comment, {
      foreignKey: "authorId",
      as: "comments",
      onDelete: "CASCADE",
    });

    Profile.hasMany(models.ProfileView, {
      foreignKey: "profileOwnerId",
      as: "ProfileViews",
    });

    Profile.hasMany(models.ProfileView, {
      foreignKey: "viewerId",
      as: "ViewedProfiles",
    });

    Profile.hasMany(models.Business, {
      foreignKey: "profileId",
      onDelete: "CASCADE",
    });

    Profile.hasOne(models.NetworkRouter, {
      foreignKey: "profileId",
    });

    Profile.hasMany(models.TicketProfile, {
      foreignKey: "profileId",
    });
  };

  return Profile;
};
