// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      firstname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      pushToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      referralCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      successfulReferrals: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      verificationCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      verificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

    },
    {
      tableName: "users",
      indexes: [
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["username"] },
      ],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Profile, {
      foreignKey: "userId",
      as: "profiles",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Notification, {
      foreignKey: "recipientId",
      as: "ReceivedNotifications",
    });

    User.hasMany(models.Notification, {
      foreignKey: "senderId",
      as: "SentNotifications",
    });

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
  };

  return User;
};
