module.exports = (sequelize, DataTypes) => {
    const Profile = sequelize.define("Profile", {
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
        closeUniversity: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        fullAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        streetAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        state: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        country: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        city: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        geoLocation: {
            type: DataTypes.GEOMETRY("POINT"),
            allowNull: true
        },
        followers: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        following: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        cacNo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        businessCategory: {
            type: DataTypes.ENUM("sme", "large_enterprise"),
            allowNull: false,
            defaultValue: "sme",
        },
        placesVisited: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
    }, {
        tableName: "profiles",
        indexes: [{ fields: ["userId"] }, { fields: ["profileType"] }],
    });
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
        Profile.hasMany(models.Post, {
            foreignKey: "profileId",
            as: "posts",
            onDelete: "CASCADE",
        });
        Profile.hasMany(models.Post, {
            foreignKey: "reviewTarget",
            as: "reviews",
            onDelete: "CASCADE",
        });
        Profile.hasMany(models.Social, {
            foreignKey: "businessId",
            as: "socials",
            onDelete: "CASCADE",
        });
        Profile.hasMany(models.Media, {
            foreignKey: "targetId",
            as: "media",
            constraints: false,
            scope: {
                targetType: "profile"
            }
        });
    };
    return Profile;
};
