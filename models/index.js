const Business = require("./Business");
const BusinessPosts = require("./BusinessPost");
const sequelize = require("../config/database");

// One-to-Many relationship: A Business can have multiple posts
Business.hasMany(BusinessPosts, {
  foreignKey: "businessId",
  onDelete: "CASCADE",
});
BusinessPosts.belongsTo(Business, { foreignKey: "businessId" });

sequelize
  .sync()
  .then(() => {
    console.log("Tables created successfully!");
  })
  .catch((error) => {
    console.error("Error creating tables:", error);
  });

module.exports = { Business, BusinessPosts };
