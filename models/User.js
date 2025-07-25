

const User = sequelize.define(
  "User",
  {
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    picture: {
      type: DataTypes.TEXT,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    pushToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    interests: {
      type: DataTypes.JSON,
    },
    userType: {
      type: DataTypes.STRING,
    },
    followersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    followingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    profession: {
      type: DataTypes.STRING,
    },
    skills: {
      type: DataTypes.STRING,
    },
    gender: {
      type: DataTypes.STRING,
    },
    isStudent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    university: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordOTP: {
      type: DataTypes.INTEGER,
    },
    resetPasswordExpires: {
      type: DataTypes.TEXT,
    },
    location: {
      type: DataTypes.TEXT,
    },
    referralCode: {
      type: DataTypes.STRING(8),
      unique: true,
      allowNull: true
    },
    successfulReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    placesVisited: {
      type: DataTypes.JSON,
    },
    currentPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "ID of the currently active plan"
    },
    currentBusinessPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    planExpirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: "When the current plan expires"
    },
    planStatus: {
      type: DataTypes.ENUM('active', 'expired', 'none'),
      defaultValue: 'none',
      comment: "Current status of the user's plan"
    },
  },
  {
    tableName: "users",
    indexes: [
      { unique: true, fields: ["email"] },
      { unique: true, fields: ["username"] },
      { fields: ["currentPlanId"] },
      { fields: ["currentBusinessPlanId"] },
      { fields: ["planStatus"] },
      { fields: ["isStudent"] },
      { fields: ["university"] },
    ],
    hooks: {
      beforeSave: async (user, options) => {
        if (user.planExpirationDate) {
          user.planStatus = new Date(user.planExpirationDate) > new Date()
            ? 'active'
            : 'expired';
        } else {
          user.planStatus = 'none';

        }
      }
    }
  );

  User.associate = (models) => {
      User.belongsToMany(models.User, {
        as: "Followers",
        through: models.UserFollower,
        foreignKey: "followedId",
        otherKey: "followerId",
      });

      User.belongsToMany(models.User, {
        as: "Following",
        through: models.UserFollower,
        foreignKey: "followerId",
        otherKey: "followedId",
      });

      User.hasMany(models.Notification, {
        foreignKey: "recipientId",
        as: "ReceivedNotifications",
      });

      User.hasMany(models.Notification, {
        foreignKey: "senderId",
        as: "SentNotifications",
      });


// Associations
User.belongsToMany(User, {
  as: "Followers",
  through: UserFollowers,
  foreignKey: "followedId",
  otherKey: "followerId",
});


      User.belongsTo(models.Business, {
        foreignKey: "currentBusinessPlanId",
        as: "currentBusiness",
        constraints: false // In case the business gets deleted
      });

      User.hasOne(models.NetworkRouter, {
        foreignKey: "userId",
      });

      User.hasMany(models.Comment, {
        foreignKey: "authorId",
        as: "comments",
        onDelete: "CASCADE",
      });

      User.hasMany(models.ProfileView, { foreignKey: "profileOwnerId", as: "ProfileViews" });

      User.hasMany(models.ProfileView, { foreignKey: "viewerId", as: "ViewedProfiles" });


User.hasMany(BusinessSchema, {
  foreignKey: "userId",
  onDelete: "CASCADE"
});


      User.hasMany(models.TicketProfile, {
        foreignKey: "userId",
      });

  };

  return  User;
    
}
