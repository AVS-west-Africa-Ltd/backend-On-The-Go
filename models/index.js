const Business = require("./Business");
const BusinessPosts = require("./BusinessPost");
const sequelize = require("../config/database");

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
