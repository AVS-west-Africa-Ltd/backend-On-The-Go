const Business = require("./Business");
const BusinessPosts = require("./BusinessPost");
const BusinessFollowers = require("./BusinessFollowers");
const sequelize = require("../config/database");

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

sequelize
  .sync()
  .then(() => {
    // console.log("Tables created successfully!");
  })
  .catch((error) => {
    console.error("Error creating tables:", error);
  });

module.exports = { Business, BusinessPosts, BusinessFollowers };
