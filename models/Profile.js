
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
        unique: true,
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
      followers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      following: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.FLOAT,
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
    }
  );

  Profile.associate = (models) => {

    Profile.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    Profile.hasMany(models.Comment, {
      foreignKey: "profileId",
      as: "comments",
    });

    Profile.hasOne(models.NetworkRouter, {
      foreignKey: "profileId",
    });

    Profile.hasMany(models.TicketProfile, {
      foreignKey: "profileId",
    });

    Profile.hasMany(models.Amenity, {
      foreignKey: "businessId",
      as: "amenities",
      onDelete: "CASCADE",
    });
  };

  return Profile;
};
