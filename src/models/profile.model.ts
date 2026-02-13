import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  ModelStatic,
} from "sequelize";
import { User } from "./user.model";
import { Comment } from "./comment.model";
import { MikrotikRouter } from "./mikrotikRouter.model";
import { TicketProfile } from "./ticketProfile.model";
import { Amenity } from "./amenity.model";
import { Post } from "./post.model";
import { Social } from "./social.model";
import { Media } from "./media.model";
import { Insight } from "./insight.model";
import { Admin } from "./admin.model";
import { Bookmark } from "./bookmark.model";
import { TBusinessCategory, TProfileType } from "./types/profile.types";

export class Profile extends Model<
  InferAttributes<Profile>,
  InferCreationAttributes<Profile>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare profileType: CreationOptional<TProfileType>;
  declare businessType: CreationOptional<string | null>;
  declare userName: string;
  declare picture: CreationOptional<string | null>;
  declare bio: CreationOptional<string | null>;
  declare interests: CreationOptional<string[] | null>;
  declare profession: CreationOptional<string | null>;
  declare skills: CreationOptional<string[] | null>;
  declare gender: CreationOptional<string | null>;
  declare isStudent: CreationOptional<boolean>;
  declare closeUniversity: CreationOptional<boolean | null>;
  declare fullAddress: CreationOptional<string | null>;
  declare streetAddress: CreationOptional<string | null>;
  declare state: CreationOptional<string | null>;
  declare country: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare geoLocation: CreationOptional<{ type: string; coordinates: [number, number] } | null>;
  declare followers: CreationOptional<number>;
  declare following: CreationOptional<number>;
  declare cacNo: CreationOptional<string | null>;
  declare website: CreationOptional<string | null>;
  declare rating: CreationOptional<number>;
  declare businessCategory: CreationOptional<TBusinessCategory | null>;
  declare placesVisited: CreationOptional<string[] | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare comments?: NonAttribute<Comment[]>;
  declare networkRouter?: NonAttribute<MikrotikRouter>;
  declare ticketProfiles?: NonAttribute<TicketProfile[]>;
  declare amenities?: NonAttribute<Amenity[]>;
  declare posts?: NonAttribute<Post[]>;
  declare reviews?: NonAttribute<Post[]>;
  declare socials?: NonAttribute<Social[]>;
  declare media?: NonAttribute<Media[]>;
  declare insights?: NonAttribute<Insight[]>;
  declare admins?: NonAttribute<Admin[]>;
  declare bookmarks?: NonAttribute<Bookmark[]>;

  static associate(models: Record<string, ModelStatic<Model>>) {
    if (models.User) {
      Profile.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
    if (models.Comment) {
      Profile.hasMany(models.Comment, {
        foreignKey: "profileId",
        as: "comments",
      });
    }
    if (models.MikrotikRouter) {
      Profile.hasOne(models.MikrotikRouter, {
        foreignKey: "profileId",
      });
    }
    if (models.TicketProfile) {
      Profile.hasMany(models.TicketProfile, {
        foreignKey: "profileId",
      });
    }
    if (models.Amenity) {
      Profile.hasMany(models.Amenity, {
        foreignKey: "businessId",
        as: "amenities",
        onDelete: "CASCADE",
      });
    }
    if (models.Post) {
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
    }
    if (models.Social) {
      Profile.hasMany(models.Social, {
        foreignKey: "businessId",
        as: "socials",
        onDelete: "CASCADE",
      });
    }
    if (models.Media) {
      Profile.hasMany(models.Media, {
        foreignKey: "targetId",
        as: "media",
        constraints: false,
        // scopes handled at query time or default scope
      });
    }
    if (models.Insight) {
      Profile.hasMany(models.Insight, {
        foreignKey: "profileId",
        as: "insights",
      });
    }
    if (models.Admin) {
      Profile.hasMany(models.Admin, {
        foreignKey: "profileId",
        as: "admins",
        onDelete: "CASCADE",
      });
    }
    if (models.Bookmark) {
      Profile.hasMany(models.Bookmark, {
        foreignKey: "profileId",
        as: "bookmarks",
        onDelete: "CASCADE",
      });
    }
  }

  static initModel(sequelize: Sequelize): ModelStatic<Profile> {
    Profile.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
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
          defaultValue: "",
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
          defaultValue: [],
        },
        profession: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        skills: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
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
          allowNull: true,
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
          allowNull: true,
        },
        rating: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        businessCategory: {
          type: DataTypes.ENUM("sme", "large_enterprise"),
          allowNull: true,
          defaultValue: null,
        },
        placesVisited: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "profiles",
        timestamps: true,
        indexes: [{ fields: ["userId"] }, { fields: ["profileType"] }],
      }
    );

    return Profile;
  }
}

export default (sequelize: Sequelize) => Profile.initModel(sequelize);