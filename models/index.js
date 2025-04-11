const Business = require("./Business");
const BusinessPosts = require("./BusinessPost");
const BusinessFollowers = require("./BusinessFollowers");
const User = require("./User");
const PushNotification = require("./PushNotification");
const sequelize = require("../config/database");

// Business relationships
Business.hasMany(BusinessPosts, {
  foreignKey: "businessId",
  onDelete: "CASCADE",
});
BusinessPosts.belongsTo(Business, { foreignKey: "businessId" });

Business.belongsToMany(Business, {
  through: BusinessFollowers,
  as: "Followers",
  foreignKey: "followedId",
  otherKey: "followerId",
  onDelete: "CASCADE",
});

Business.belongsToMany(Business, {
  through: BusinessFollowers,
  as: "Following",
  foreignKey: "followerId",
  otherKey: "followedId",
  onDelete: "CASCADE",
});

// PushNotification relationships
PushNotification.belongsTo(User, {
  foreignKey: "userId",
  as: "user"
});

User.hasMany(PushNotification, {
  foreignKey: "userId",
  as: "notifications"
});

sequelize
  .sync()
  .then(() => {
    // console.log("Tables created successfully!");
  })
  .catch((error) => {
    console.error("Error creating tables:", error);
  });

module.exports = { 
  Business, 
  BusinessPosts, 
  BusinessFollowers,
  User,
  PushNotification 
};
