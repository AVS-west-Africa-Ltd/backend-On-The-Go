module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    "Branch",
    {
      
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "profiles",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          len: {
            args: [2, 100],
            msg: "Branch name must be between 2 and 100 characters",
          },
        },
      },

      fullAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      streetAddress: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      ratingCount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },

      reviewCount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },

      geoLocation: {
        type: DataTypes.GEOMETRY("POINT"),
        allowNull: true,
        comment: "Stores latitude and longitude for the branch",
      },

      isHQ: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      }

    },
    {
      tableName: "branches",
      indexes: [
        { fields: ["profileId"] },
      ],
    }
  );

  Branch.associate = (models) => {
    
    Branch.belongsTo(models.Profile, {
      foreignKey: "profileId",
      as: "profile",
      onDelete: "CASCADE",
    });
  };

  return Branch;
};